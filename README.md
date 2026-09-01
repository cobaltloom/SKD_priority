# SKD_priority

年末年始に休暇希望が集中したとき、過去の出勤・取得履歴から優先順位を自動計算して
公平にローテーションするための社内向けiOSアプリ。

- 社員: 対象期間の休暇希望日を提出。自分の優先スコアと過去の実績を確認できる
- 管理者: 対象期間を設定し、優先スコア順に並んだ希望一覧から承認/却下し、
  期間を確定すると来年用の出勤実績が自動記録される(持ち回り制)

## 構成

- `ios/SKDPriorityApp/` — SwiftUI製iOSアプリのソース一式
- `firebase/firestore.rules` — Firestoreセキュリティルール
- `docs/SETUP.md` — Mac/Xcode側でのセットアップ手順

技術スタック: SwiftUI + Firebase (Authentication / Firestore)

セットアップは [`docs/SETUP.md`](docs/SETUP.md) を参照してください。