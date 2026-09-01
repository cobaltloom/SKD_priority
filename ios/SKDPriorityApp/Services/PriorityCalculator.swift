import Foundation

enum PriorityCalculator {
    // 直近何年分の履歴を優先順位計算に使うか
    static let lookbackYears = 3

    // スコアが高いほど「今年は休みを優先的に取得できる」。
    // 直近 lookbackYears 年の出勤(休めなかった)回数を主要因とし、
    // 同点の場合は生涯出勤回数の少なさで並び順が安定するよう小数部で補正する。
    static func score(forEmployee employeeId: String, records: [HolidayWorkRecord], targetFiscalYear: Int) -> Double {
        let employeeRecords = records.filter { $0.employeeId == employeeId }
        let recentWorkedCount = employeeRecords
            .filter { $0.fiscalYear < targetFiscalYear && $0.fiscalYear >= targetFiscalYear - lookbackYears }
            .filter(\.worked)
            .count
        let lifetimeWorkedCount = employeeRecords.filter(\.worked).count

        return Double(recentWorkedCount) * 10 + Double(lifetimeWorkedCount) * 0.1
    }

    // リクエスト一覧に優先度順位(スコア降順)を付けて返す。同スコアは提出が早い方を上位に。
    static func rank(_ requests: [LeaveRequest]) -> [LeaveRequest] {
        requests.sorted { lhs, rhs in
            if lhs.priorityScore != rhs.priorityScore {
                return lhs.priorityScore > rhs.priorityScore
            }
            return lhs.submittedAt < rhs.submittedAt
        }
    }
}
