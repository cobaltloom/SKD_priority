import SwiftUI

struct RootView: View {
    @EnvironmentObject private var authService: AuthService

    var body: some View {
        Group {
            if authService.isLoading {
                ProgressView()
            } else if let employee = authService.currentEmployee {
                switch employee.role {
                case .admin:
                    AdminDashboardView(employee: employee)
                case .employee:
                    EmployeeHomeView(employee: employee)
                }
            } else {
                LoginView()
            }
        }
    }
}
