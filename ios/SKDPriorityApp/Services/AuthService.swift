import FirebaseAuth
import FirebaseFirestore
import Foundation

@MainActor
final class AuthService: ObservableObject {
    @Published var currentEmployee: Employee?
    @Published var isLoading = true
    @Published var errorMessage: String?

    private let db = Firestore.firestore()
    private var authHandle: AuthStateDidChangeListenerHandle?

    init() {
        authHandle = Auth.auth().addStateDidChangeListener { [weak self] _, user in
            Task { await self?.handleAuthChange(uid: user?.uid) }
        }
    }

    deinit {
        if let authHandle {
            Auth.auth().removeStateDidChangeListener(authHandle)
        }
    }

    private func handleAuthChange(uid: String?) async {
        guard let uid else {
            currentEmployee = nil
            isLoading = false
            return
        }
        do {
            let snapshot = try await db.collection("employees").document(uid).getDocument()
            currentEmployee = try snapshot.data(as: Employee.self)
        } catch {
            errorMessage = "従業員情報の取得に失敗しました: \(error.localizedDescription)"
            currentEmployee = nil
        }
        isLoading = false
    }

    // 社員コードは "employeeCode@skd.local" 形式のダミーメールで Firebase Auth に登録する運用。
    // アカウント自体の発行は管理者が Firebase コンソール側で行う(SETUP.md 参照)。
    func signIn(employeeCode: String, password: String) async {
        errorMessage = nil
        let email = Self.email(for: employeeCode)
        do {
            _ = try await Auth.auth().signIn(withEmail: email, password: password)
        } catch {
            errorMessage = "ログインに失敗しました。社員コードまたはパスワードをご確認ください。"
        }
    }

    func signOut() {
        try? Auth.auth().signOut()
        currentEmployee = nil
    }

    static func email(for employeeCode: String) -> String {
        "\(employeeCode.lowercased())@skd.local"
    }
}
