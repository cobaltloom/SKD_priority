import Foundation

enum PeriodStatus: String, Codable {
    case open          // 希望受付中
    case calculating   // 受付締切、優先順位計算・調整中
    case finalized      // 確定済み
}

struct HolidayPeriod: Identifiable, Codable, Equatable {
    var id: String          // 例: "2026"
    var fiscalYear: Int
    var startDate: Date
    var endDate: Date
    var requestDeadline: Date
    var status: PeriodStatus

    var dateRange: [Date] {
        var dates: [Date] = []
        var current = startDate
        let calendar = Calendar.current
        while current <= endDate {
            dates.append(current)
            guard let next = calendar.date(byAdding: .day, value: 1, to: current) else { break }
            current = next
        }
        return dates
    }
}
