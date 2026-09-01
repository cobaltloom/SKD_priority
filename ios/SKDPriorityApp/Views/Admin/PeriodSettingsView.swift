import SwiftUI

struct PeriodSettingsView: View {
    let period: HolidayPeriod?
    let onSaved: () async -> Void

    @Environment(\.dismiss) private var dismiss
    @StateObject private var firestoreService = FirestoreService()

    @State private var fiscalYear: Int
    @State private var startDate: Date
    @State private var endDate: Date
    @State private var requestDeadline: Date
    @State private var status: PeriodStatus
    @State private var isSaving = false
    @State private var errorMessage: String?

    init(period: HolidayPeriod?, onSaved: @escaping () async -> Void) {
        self.period = period
        self.onSaved = onSaved
        let currentYear = Calendar.current.component(.year, from: Date())
        _fiscalYear = State(initialValue: period?.fiscalYear ?? currentYear)
        _startDate = State(initialValue: period?.startDate ?? Date())
        _endDate = State(initialValue: period?.endDate ?? Date())
        _requestDeadline = State(initialValue: period?.requestDeadline ?? Date())
        _status = State(initialValue: period?.status ?? .open)
    }

    var body: some View {
        Form {
            Section("年度") {
                Stepper("\(fiscalYear)年", value: $fiscalYear, in: 2020...2100)
            }

            Section("休暇対象期間") {
                DatePicker("開始日", selection: $startDate, displayedComponents: .date)
                DatePicker("終了日", selection: $endDate, in: startDate..., displayedComponents: .date)
            }

            Section("希望提出期限") {
                DatePicker("期限", selection: $requestDeadline, displayedComponents: .date)
            }

            Section("状態") {
                Picker("状態", selection: $status) {
                    Text("受付中").tag(PeriodStatus.open)
                    Text("調整中").tag(PeriodStatus.calculating)
                    Text("確定済み").tag(PeriodStatus.finalized)
                }
            }

            if let errorMessage {
                Text(errorMessage).foregroundStyle(.red)
            }

            Button {
                Task { await save() }
            } label: {
                if isSaving {
                    ProgressView().frame(maxWidth: .infinity)
                } else {
                    Text("保存").frame(maxWidth: .infinity)
                }
            }
            .disabled(isSaving)
        }
        .navigationTitle("期間の設定")
    }

    private func save() async {
        isSaving = true
        errorMessage = nil
        let newPeriod = HolidayPeriod(
            id: String(fiscalYear),
            fiscalYear: fiscalYear,
            startDate: startDate,
            endDate: endDate,
            requestDeadline: requestDeadline,
            status: status
        )
        do {
            try await firestoreService.savePeriod(newPeriod)
            await onSaved()
            dismiss()
        } catch {
            errorMessage = "保存に失敗しました: \(error.localizedDescription)"
        }
        isSaving = false
    }
}
