# 過去データ一括投入スクリプト

社内DBにある過去の年末年始出勤データを、アプリの優先順位計算が使う
`employees/{uid}/workRecords/{fiscalYear}` に一括投入するツールです。

このスクリプトは Firebase Admin SDK を使い、Firestoreのセキュリティルールを
バイパスして直接書き込みます(通常のアプリ操作は管理者ロールのみに制限していますが、
初期データ移行はアプリを経由しないため、この専用スクリプトが必要です)。

## 事前準備

1. Node.js (v18以上) をインストール
2. このフォルダで依存パッケージをインストール
   ```
   cd scripts/import-history
   npm install
   ```
3. Firebaseコンソール → プロジェクトの設定 → サービスアカウント →
   「新しい秘密鍵の生成」で `serviceAccountKey.json` をダウンロード
   (**Gitにコミットしない**。誰でもFirestoreに全権アクセスできる鍵です)
4. 対象の社員は先に `employees` コレクションに登録しておく(`docs/SETUP.md` の
   手順4を参照)。このスクリプトは `employeeCode` フィールドでFirestoreの社員と
   突き合わせるので、CSV内のコードと登録済みの `employeeCode` を一致させること

## 社内DBのデータがどちらの形か

社内DB側の形式がまだ分からない場合は、まず社内DB担当者に次を確認してください。

- **(A) 社員ごと・年度ごとに「出勤した/休めた」が既に集計されている**
  → `--mode=summary` を使う
- **(B) 日々の勤怠ログ(出退勤打刻など)の生データしかない**
  → `--mode=daily` を使う(年末年始の期間に1日でも出勤ログがあれば「出勤した年」とみなす)

どちらの形でも、社内DBのクエリ結果やExcel台帳をCSVとして書き出せれば取り込めます。

## モード1: 集計済みデータ (`--mode=summary`)

CSVフォーマット(`examples/summary-example.csv` 参照):

```
employeeCode,fiscalYear,worked
e001,2023,true
e001,2024,false
```

- `worked`: `true`/`false`(`1`/`0`、`yes`/`no`、`出勤`/`休暇` も可)

実行例(まず必ず `--dryRun` で内容を確認):

```
node import-history.js --mode=summary \
  --serviceAccount=./serviceAccountKey.json \
  --file=./data/summary.csv \
  --dryRun

# 内容を確認したら --dryRun を外して本実行
node import-history.js --mode=summary \
  --serviceAccount=./serviceAccountKey.json \
  --file=./data/summary.csv
```

## モード2: 日次勤怠ログ (`--mode=daily`)

CSVフォーマット(`examples/daily-logs-example.csv` 参照。**出勤した日の行だけ**でよい):

```
employeeCode,date
e001,2022-12-30
e001,2023-01-02
```

年度ごとの年末年始期間を別途 `periods.json` で定義する(`examples/periods-example.json` 参照):

```
{
  "2023": { "start": "2022-12-29", "end": "2023-01-03" },
  "2024": { "start": "2023-12-29", "end": "2024-01-03" }
}
```

実行例:

```
node import-history.js --mode=daily \
  --serviceAccount=./serviceAccountKey.json \
  --file=./data/daily-logs.csv \
  --periods=./data/periods.json \
  --dryRun
```

**注意**: このモードは「期間中に出勤ログが1件もない社員は休みを取得できた」とみなします。
勤怠ログの取得漏れ・エクスポート漏れがあると、実際には出勤していたのに休暇扱いに
なってしまうため、`--dryRun` の結果を必ず目視確認してから本実行してください。

## 実行後の確認

Firebaseコンソールの Firestore で `employees/{社員のUID}/workRecords/{年度}` に
`worked` フィールドを持つドキュメントが作成されていれば成功です。アプリ側は
このデータを直近3年分読み込んで優先スコアを計算します(`PriorityCalculator`)。
