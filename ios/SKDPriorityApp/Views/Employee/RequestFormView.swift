import SwiftUI

struct RequestFormView: View {
    let employee: Employee
    let period: HolidayPeriod
    let existingRequest: LeaveRequest?
    let onSaved: () async -> Void

    @Environment(\.dismiss) private var dismiss
    @StateObject private var firestoreService = FirestoreService()

    @State private var selectedDates: Set<Date>
    @State private var isSaving = false
    @State private var errorMessage: String?

    init(employee: Employee, period: HolidayPeriod, existingRequest: LeaveRequest?, onSaved: @escaping () async -> Void) {
        self.employee = employee
        self.period = period
        self.existingRequest = existingRequest
        self.onSaved = onSaved
        _selectedDates = State(initialValue: Set(existingRequest?.desiredDates ?? []))
    }

    var body: some View {
        Form {
            Section("休みたい日を選択してください") {
                ForEach(period.dateRange, id: \.self) { date in
                    Toggle(date.japaneseShort, isOn: Binding(
                        get: { selectedDates.contains(where: { $0.isSameDay(as: date) }) },
                        set: { isOn in
                            if isOn {
                                selectedDates.insert(date)
                            } else {
                                selectedDates.remove(where: { $0.isSameDay(as: date) })
                            }
                        }
                    ))
                }
            }

            if let errorMessage {
                Text(errorMessage).foregroundStyle(.red)
            }

            Button {
                Task { await submit() }
            } label: {
                if isSaving {
                    ProgressView().frame(maxWidth: .infinity)
                } else {
                    Text("希望を提出する").frame(maxWidth: .infinity)
                }
            }
            .disabled(selectedDates.isEmpty || isSaving)
        }
        .navigationTitle("休暇希望")
    }

    private func submit() async {
        isSaving = true
        errorMessage = nil
        do {
            let records = try await firestoreService.fetchWorkRecords(forEmployee: employee.id)
            let score = PriorityCalculator.score(
                forEmployee: employee.id,
                records: records,
                targetFiscalYear: period.fiscalYear
            )
            let request = LeaveRequest(
                id: employee.id,
                periodId: period.id,
                employeeId: employee.id,
                employeeName: employee.name,
                desiredDates: selectedDates.sorted(),
                priorityScore: score,
                status: .pending,
                submittedAt: existingRequest?.submittedAt ?? Date(),
                adminNote: existingRequest?.adminNote
            )
            try await firestoreService.submitRequest(request)
            await onSaved()
            dismiss()
        } catch {
            errorMessage = "提出に失敗しました: \(error.localizedDescription)"
        }
        isSaving = false
    }
}

private extension Set where Element == Date {
    mutating func remove(where predicate: (Date) -> Bool) {
        if let match = first(where: predicate) {
            remove(match)
        }
    }
}
