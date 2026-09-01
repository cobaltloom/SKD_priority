import SwiftUI

struct AdminDashboardView: View {
    let employee: Employee

    @EnvironmentObject private var authService: AuthService
    @StateObject private var firestoreService = FirestoreService()

    @State private var period: HolidayPeriod?
    @State private var isLoading = true

    var body: some View {
        NavigationStack {
            List {
                if let period {
                    Section("現在の期間") {
                        LabeledContent("年度", value: "\(period.fiscalYear)年")
                        LabeledContent("期間", value: "\(period.startDate.japaneseMedium) 〜 \(period.endDate.japaneseMedium)")
                        LabeledContent("状態", value: statusLabel(period.status))
                    }
                } else if !isLoading {
                    Text("期間が未設定です。まず期間を作成してください。")
                        .foregroundStyle(.secondary)
                }

                Section {
                    NavigationLink("期間の設定") {
                        PeriodSettingsView(period: period) {
                            await loadPeriod()
                        }
                    }
                    if let period {
                        NavigationLink("休暇希望の確認・確定") {
                            RequestsListView(period: period, allEmployeesLoader: firestoreService.fetchEmployees) {
                                await loadPeriod()
                            }
                        }
                    }
                }
            }
            .navigationTitle("管理者ダッシュボード")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("ログアウト") { authService.signOut() }
                }
            }
            .refreshable { await loadPeriod() }
            .task { await loadPeriod() }
            .overlay {
                if isLoading { ProgressView() }
            }
        }
    }

    private func loadPeriod() async {
        isLoading = true
        period = try? await firestoreService.fetchCurrentPeriod()
        isLoading = false
    }

    private func statusLabel(_ status: PeriodStatus) -> String {
        switch status {
        case .open: return "受付中"
        case .calculating: return "調整中"
        case .finalized: return "確定済み"
        }
    }
}
