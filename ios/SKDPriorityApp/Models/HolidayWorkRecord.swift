import Foundation

// 1人 × 1年末年始期間 の実績。worked=true は「休みが取れず出勤した」年。
// PriorityCalculator がこの履歴から今年の優先順位を算出する。
struct HolidayWorkRecord: Identifiable, Codable, Equatable {
    var id: String       // "\(employeeId)_\(fiscalYear)"
    var employeeId: String
    var fiscalYear: Int
    var worked: Bool
}
