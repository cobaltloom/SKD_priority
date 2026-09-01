import SwiftUI

struct RequestsListView: View {
    let period: HolidayPeriod
    let allEmployeesLoader: () async throws -> [Employee]
    let onFinalized: () async -> Void

    @StateObject private var firestoreService = FirestoreService()
    @State private var requests: [LeaveRequest] = []
    @State private var isLoading = true
    @State private var errorMessage: String?
    @State private var showFinalizeConfirm = false
    @State private var isFinalizing = false

    private var rankedRequests: [LeaveRequest] {
        PriorityCalculator.rank(requests)
    }

    var body: some View {
        List {
            Section {
                Text("優先スコアが高い順に表示しています。上位から承認してください。")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            ForEach(Array(rankedRequests.enumerated()), id: \.element.id) { index, request in
                VStack(alignment: .leading, spacing: 6) {
                    HStack {
                        Text("\(index + 1)位  \(request.employeeName)")
                            .font(.headline)
                        Spacer()
                        Text(String(format: "score %.1f", request.priorityScore))
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    Text("希望日数: \(request.desiredDates.count)日")
                        .font(.subheadline)

                    Picker("状態", selection: Binding(
                        get: { request.status },
                        set: { newStatus in
                            Task { await updateStatus(request, to: newStatus) }
                        }
                    )) {
                        Text("審査待ち").tag(RequestStatus.pending)
                        Text("承認").tag(RequestStatus.approved)
                        Text("却下").tag(RequestStatus.rejected)
                    }
                    .pickerStyle(.segmented)
                }
                .padding(.vertical, 4)
            }

            if let errorMessage {
                Text(errorMessage).foregroundStyle(.red)
            }

            if period.status != .finalized {
                Section {
                    Button("この期間を確定する", role: .destructive) {
                        showFinalizeConfirm = true
                    }
                    .disabled(isFinalizing || requests.isEmpty)
                }
            }
        }
        .navigationTitle("休暇希望一覧")
        .refreshable { await loadRequests() }
        .task { await loadRequests() }
        .overlay {
            if isLoading { ProgressView() }
        }
        .confirmationDialog(
            "確定すると希望を提出していない社員は全員「出勤」として記録され、来年の優先順位計算に使われます。よろしいですか?",
            isPresented: $showFinalizeConfirm,
            titleVisibility: .visible
        ) {
            Button("確定する", role: .destructive) {
                Task { await finalize() }
            }
            Button("キャンセル", role: .cancel) {}
        }
    }

    private func loadRequests() async {
        isLoading = true
        errorMessage = nil
        do {
            requests = try await firestoreService.fetchRequests(forPeriod: period.id)
        } catch {
            errorMessage = "読み込みに失敗しました: \(error.localizedDescription)"
        }
        isLoading = false
    }

    private func updateStatus(_ request: LeaveRequest, to status: RequestStatus) async {
        do {
            try await firestoreService.updateRequestStatus(
                periodId: period.id,
                requestId: request.id,
                status: status,
                adminNote: request.adminNote
            )
            if let index = requests.firstIndex(where: { $0.id == request.id }) {
                requests[index].status = status
            }
        } catch {
            errorMessage = "更新に失敗しました: \(error.localizedDescription)"
        }
    }

    private func finalize() async {
        isFinalizing = true
        errorMessage = nil
        do {
            let employees = try await allEmployeesLoader()
            try await firestoreService.finalizePeriod(period, requests: requests, allEmployees: employees)
            await onFinalized()
        } catch {
            errorMessage = "確定処理に失敗しました: \(error.localizedDescription)"
        }
        isFinalizing = false
    }
}
