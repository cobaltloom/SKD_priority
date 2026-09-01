import SwiftUI

struct LoginView: View {
    @EnvironmentObject private var authService: AuthService
    @State private var employeeCode = ""
    @State private var password = ""
    @State private var isSigningIn = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 20) {
                Spacer()

                VStack(spacing: 4) {
                    Text("SKD 休暇優先度")
                        .font(.largeTitle.bold())
                    Text("年末年始休暇の希望登録")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }

                VStack(spacing: 12) {
                    TextField("社員コード", text: $employeeCode)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .textFieldStyle(.roundedBorder)

                    SecureField("パスワード", text: $password)
                        .textFieldStyle(.roundedBorder)
                }
                .padding(.horizontal)

                if let errorMessage = authService.errorMessage {
                    Text(errorMessage)
                        .font(.footnote)
                        .foregroundStyle(.red)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)
                }

                Button {
                    Task {
                        isSigningIn = true
                        await authService.signIn(employeeCode: employeeCode, password: password)
                        isSigningIn = false
                    }
                } label: {
                    if isSigningIn {
                        ProgressView()
                            .frame(maxWidth: .infinity)
                    } else {
                        Text("ログイン")
                            .frame(maxWidth: .infinity)
                    }
                }
                .buttonStyle(.borderedProminent)
                .disabled(employeeCode.isEmpty || password.isEmpty || isSigningIn)
                .padding(.horizontal)

                Spacer()
                Spacer()
            }
        }
    }
}
