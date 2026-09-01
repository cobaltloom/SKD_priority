import Foundation

enum EmployeeRole: String, Codable {
    case employee
    case admin
}

struct Employee: Identifiable, Codable, Equatable {
    var id: String
    var employeeCode: String
    var name: String
    var department: String
    var role: EmployeeRole
    var joinDate: Date
}
