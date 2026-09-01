import Foundation

enum RequestStatus: String, Codable {
    case pending
    case approved
    case rejected
}

struct LeaveRequest: Identifiable, Codable, Equatable {
    var id: String
    var periodId: String
    var employeeId: String
    var employeeName: String
    var desiredDates: [Date]
    var priorityScore: Double
    var status: RequestStatus
    var submittedAt: Date
    var adminNote: String?
}
