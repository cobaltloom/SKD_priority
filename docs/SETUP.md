# セットアップ手順(Mac / Xcode 側)

このリポジトリにはXcodeプロジェクトファイル(.xcodeproj)は含めていません。
手書きのpbxprojはXcodeなしでは壊れていないか検証できないため、確実に開ける
「Xcodeのプロジェクト作成ウィザード + ソース一式コピー」方式にしています。

## 1. Firebaseプロジェクトを作る

1. https://console.firebase.google.com でプロジェクトを新規作成
2. 「iOSアプリを追加」でBundle IDを登録(例: `com.yourcompany.skdpriority`)
3. 生成された `GoogleService-Info.plist` をダウンロードしておく
4. 左メニュー「Authentication」→ Sign-in method で **メール/パスワード** を有効化
5. 左メニュー「Firestore Database」→ 本番環境モードでデータベースを作成
6. `firebase/firestore.rules` の内容を Firestore の「ルール」タブに貼り付けて公開
   (Firebase CLIがあれば `firebase deploy --only firestore:rules` でも可)
7. `firebase/firestore.indexes.json` の複合インデックス(`holidayPeriods` の
   `status` + `fiscalYear`)も登録する。Firebase CLIなら
   `firebase deploy --only firestore:indexes`。CLIを使わない場合は、アプリを一度
   実行してエラーログに出るインデックス作成用リンクをコンソールで開いてもよい

## 2. Xcodeプロジェクトを作る

このリポジトリをcloneした作業ディレクトリの `ios/` フォルダの中に、そのまま
Xcodeプロジェクトを作成すると、あとでプロジェクトファイルごとコミットできて楽です。

1. Xcode → File → New → Project → iOS → App
2. Product Name: `SKDPriorityApp`、Interface: SwiftUI、Language: Swift
3. Minimum Deployment: iOS 16 以上を推奨
4. 保存先はリポジトリの `ios/` フォルダを指定(既存の `ios/SKDPriorityApp/` フォルダと
   名前がぶつかる場合は、いったん別名で作成してから中身のファイルだけ後述の手順でマージしてもよい)
5. 作成されたプロジェクトの `ContentView.swift` と、デフォルトの `SKDPriorityAppApp.swift`
   (App本体ファイル)は削除する
6. このリポジトリの `ios/SKDPriorityApp/` 以下にあるSwiftファイル・フォルダ構成
   (App / Models / Services / Utilities / Views)をまるごと、Xcodeプロジェクトの
   ナビゲータへドラッグ&ドロップして追加(Copy items if needed のチェックは、
   既にリポジトリ内にファイルがある場合は外してよい)
7. `GoogleService-Info.plist` もプロジェクトに追加(Copy items if needed にチェック)
8. 完了したら `ios/SKDPriorityApp.xcodeproj` などをこのリポジトリにコミットする
   (`GoogleService-Info.plist` は秘密情報を含むため `.gitignore` 済み。各自のFirebase
   プロジェクトのものを都度追加すること)

## 3. Firebase SDKを追加

1. Xcode → File → Add Package Dependencies
2. URL: `https://github.com/firebase/firebase-ios-sdk`
3. 追加するProduct: `FirebaseAuth`, `FirebaseFirestore`, `FirebaseCore`

## 4. 管理者・社員アカウントを作る

クライアントアプリからの自己登録は行わない設計です(社員が勝手にアカウントを
作れないようにするため)。管理者がFirebaseコンソールから作成します。

1. Authentication → Users → Add user
   - Email: `{社員コード}@skd.local` (例: `e001@skd.local`)
   - Password: 初期パスワードを設定
2. Firestore の `employees` コレクションに、作成したユーザーの **UID** をドキュメントIDとして
   以下のフィールドを持つドキュメントを追加(`id` フィールドには **ドキュメントIDと同じUID文字列**
   を入れること。アプリ側は各ドキュメント内の `id` フィールドを読んでオブジェクトを構築するため、
   ドキュメントIDと`id`フィールドの値は必ず一致させる)
   ```
   id: "<作成したユーザーのUID>"
   employeeCode: "e001"
   name: "山田 太郎"
   department: "製造部"
   role: "employee"   // 管理者なら "admin"
   joinDate: <Timestamp>
   ```

社員が多い場合は、この手順をCSVから一括登録するツールに拡張することもできます
(Firebase Admin SDK が必要になるため、現状はCloud Functions未実装の既知の制約です)。

## 5. 過去の出勤データを取り込む(社内DBからの移行)

優先順位の計算は直近数年分の年末年始出勤履歴を使うため、社内DBに過去データが
あるなら初回セットアップ時に取り込んでおくと初年度から公平な優先順位になります。
`scripts/import-history/` に、社内DBからCSVで書き出したデータをFirestoreへ一括投入
するツールを用意しています。手順は `scripts/import-history/README.md` を参照してください。

(過去データがない/取り込まない場合でも、初年度は全員スコア0からスタートするだけで、
アプリ自体は問題なく動作します。2年目以降は期間確定のたびに自動で履歴が積み上がります)

## 6. 実行

1. Xcodeでシミュレータまたは実機を選んでRun
2. 管理者アカウントでログイン→「期間の設定」で今年の年末年始期間・希望提出期限を登録
3. 社員アカウントでログイン→休暇希望を提出
4. 提出期限後、管理者が「休暇希望の確認・確定」で優先スコア順に承認/却下し、「この期間を確定する」
   を押すと、来年の優先順位計算に使う出勤実績が自動記録される

## 既知の制約 / 今後の拡張案

- 社員の招待・アカウント発行はFirebaseコンソール手動 or Admin SDK(Cloud Functions)が必要
- 過去データの一括取り込みは `scripts/import-history/` のCLIツールで対応(社内DBへの
  直接接続はまだなく、CSVエクスポート経由。将来DB形式が確定したら直接クエリする
  取り込みスクリプトに拡張可能)
- 部署ごとの最低出勤人数などの人員配置制約は未実装(承認/却下は手動判断)
- プッシュ通知(希望提出締切のリマインド、結果確定の通知)は未実装
