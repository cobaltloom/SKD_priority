import SwiftUI

struct MyHistoryView: View {
    let employee: Employee

    @StateObject private var firestoreService = FirestoreService()
    @State private var records: [HolidayWorkRecord] = []
    @State private var isLoading = true

    var body: some View {
        List {
            ForEach(records.sorted(by: { $0.fiscalYear > $1.fiscalYear })) { record in
                LabeledContent("\(record.fiscalYear)年") {
                    Text(record.worked ? "出勤" : "休暇取得")
                        .foregroundStyle(record.worked ? .orange : .green)
                }
            }
        }
        .navigationTitle("過去の年末年始実績")
        .overlay {
            if isLoading {
                ProgressView()
            } else if records.isEmpty {
                Text("履歴はまだありません").foregroundStyle(.secondary)
            }
        }
        .task {
            records = (try? await firestoreService.fetchWorkRecords(forEmployee: employee.id)) ?? []
            isLoading = false
        }
    }
}
