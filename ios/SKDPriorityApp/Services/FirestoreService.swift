import FirebaseFirestore
import Foundation

@MainActor
final class FirestoreService: ObservableObject {
    private let db = Firestore.firestore()

    // MARK: - Employees

    func fetchEmployees() async throws -> [Employee] {
        let snapshot = try await db.collection("employees").getDocuments()
        return try snapshot.documents.map { try $0.data(as: Employee.self) }
    }

    func fetchWorkRecords(forEmployee employeeId: String) async throws -> [HolidayWorkRecord] {
        let snapshot = try await db.collection("employees").document(employeeId)
            .collection("workRecords").getDocuments()
        return try snapshot.documents.map { try $0.data(as: HolidayWorkRecord.self) }
    }

    // MARK: - Holiday Periods

    func fetchCurrentPeriod() async throws -> HolidayPeriod? {
        let snapshot = try await db.collection("holidayPeriods")
            .whereField("status", isNotEqualTo: PeriodStatus.finalized.rawValue)
            .order(by: "status")
            .order(by: "fiscalYear", descending: true)
            .limit(to: 1)
            .getDocuments()
        return try snapshot.documents.first.map { try $0.data(as: HolidayPeriod.self) }
    }

    func savePeriod(_ period: HolidayPeriod) async throws {
        try db.collection("holidayPeriods").document(period.id).setData(from: period, merge: true)
    }

    // MARK: - Leave Requests

    func fetchRequests(forPeriod periodId: String) async throws -> [LeaveRequest] {
        let snapshot = try await db.collection("holidayPeriods").document(periodId)
            .collection("requests").getDocuments()
        return try snapshot.documents.map { try $0.data(as: LeaveRequest.self) }
    }

    func fetchMyRequest(periodId: String, employeeId: String) async throws -> LeaveRequest? {
        let doc = db.collection("holidayPeriods").document(periodId)
            .collection("requests").document(employeeId)
        let snapshot = try await doc.getDocument()
        guard snapshot.exists else { return nil }
        return try snapshot.data(as: LeaveRequest.self)
    }

    // 従業員ごとに1件のリクエストしか持てない設計(ドキュメントIDに employeeId を使う)なので、
    // 再提出は常に upsert になる。
    func submitRequest(_ request: LeaveRequest) async throws {
        try db.collection("holidayPeriods").document(request.periodId)
            .collection("requests").document(request.employeeId)
            .setData(from: request, merge: true)
    }

    func updateRequestStatus(periodId: String, requestId: String, status: RequestStatus, adminNote: String?) async throws {
        var data: [String: Any] = ["status": status.rawValue]
        if let adminNote {
            data["adminNote"] = adminNote
        }
        try await db.collection("holidayPeriods").document(periodId)
            .collection("requests").document(requestId).updateData(data)
    }

    // MARK: - Finalize

    // 期間確定時に、承認された人は worked=false、それ以外の全社員は worked=true として
    // 来年以降の優先順位計算に使う実績を一括登録する。
    func finalizePeriod(_ period: HolidayPeriod, requests: [LeaveRequest], allEmployees: [Employee]) async throws {
        let batch = db.batch()

        var periodDone = period
        periodDone.status = .finalized
        try batch.setData(from: periodDone, forDocument: db.collection("holidayPeriods").document(period.id), merge: true)

        let approvedEmployeeIds = Set(requests.filter { $0.status == .approved }.map(\.employeeId))
        for employee in allEmployees {
            let worked = !approvedEmployeeIds.contains(employee.id)
            let record = HolidayWorkRecord(
                id: "\(employee.id)_\(period.fiscalYear)",
                employeeId: employee.id,
                fiscalYear: period.fiscalYear,
                worked: worked
            )
            let ref = db.collection("employees").document(employee.id)
                .collection("workRecords").document(String(period.fiscalYear))
            try batch.setData(from: record, forDocument: ref, merge: true)
        }

        try await batch.commit()
    }
}
