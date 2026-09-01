import SwiftUI

struct EmployeeHomeView: View {
    let employee: Employee

    @EnvironmentObject private var authService: AuthService
    @StateObject private var firestoreService = FirestoreService()

    @State private var period: HolidayPeriod?
    @State private var myRequest: LeaveRequest?
    @State private var myRecords: [HolidayWorkRecord] = []
    @State private var isLoading = true
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            List {
                if let period {
                    Section("今年の年末年始休暇") {
                        LabeledContent("期間", value: "\(period.startDate.japaneseMedium) 〜 \(period.endDate.japaneseMedium)")
                        LabeledContent("希望提出期限", value: period.requestDeadline.japaneseMedium)
                        LabeledContent("状態", value: statusLabel(period.status))
                    }

                    Section("あなたの優先度") {
                        let score = PriorityCalculator.score(
                            forEmployee: employee.id,
                            records: myRecords,
                            targetFiscalYear: period.fiscalYear
                        )
                        LabeledContent("優先スコア", value: String(format: "%.1f", score))
                        Text("直近\(PriorityCalculator.lookbackYears)年で出勤した回数が多いほど、今年は優先的に休暇を取得できます。")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }

                    Section("休暇希望") {
                        if let myRequest {
                            LabeledContent("希望日数", value: "\(myRequest.desiredDates.count)日")
                            LabeledContent("状態", value: requestStatusLabel(myRequest.status))
                            if let note = myRequest.adminNote, !note.isEmpty {
                                Text("管理者コメント: \(note)")
                                    .font(.footnote)
                                    .foregroundStyle(.secondary)
                            }
                        }

                        NavigationLink {
                            RequestFormView(employee: employee, period: period, existingRequest: myRequest) {
                                await loadData()
                            }
                        } label: {
                            Text(myRequest == nil ? "休暇希望を提出する" : "休暇希望を編集する")
                        }
                        .disabled(period.status != .open)
                    }
                } else if !isLoading {
                    Text("現在受付中の年末年始期間はありません。")
                        .foregroundStyle(.secondary)
                }

                if let errorMessage {
                    Text(errorMessage).foregroundStyle(.red)
                }
            }
            .navigationTitle("こんにちは、\(employee.name)さん")
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    NavigationLink("過去の実績") {
                        MyHistoryView(employee: employee)
                    }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("ログアウト") { authService.signOut() }
                }
            }
            .refreshable { await loadData() }
            .task { await loadData() }
            .overlay {
                if isLoading { ProgressView() }
            }
        }
    }

    private func loadData() async {
        isLoading = true
        errorMessage = nil
        do {
            guard let currentPeriod = try await firestoreService.fetchCurrentPeriod() else {
                period = nil
                isLoading = false
                return
            }
            period = currentPeriod
            async let request = firestoreService.fetchMyRequest(periodId: currentPeriod.id, employeeId: employee.id)
            async let records = firestoreService.fetchWorkRecords(forEmployee: employee.id)
            myRequest = try await request
            myRecords = try await records
        } catch {
            errorMessage = "読み込みに失敗しました: \(error.localizedDescription)"
        }
        isLoading = false
    }

    private func statusLabel(_ status: PeriodStatus) -> String {
        switch status {
        case .open: return "受付中"
        case .calculating: return "調整中"
        case .finalized: return "確定済み"
        }
    }

    private func requestStatusLabel(_ status: RequestStatus) -> String {
        switch status {
        case .pending: return "審査待ち"
        case .approved: return "承認済み"
        case .rejected: return "却下"
        }
    }
}
