// 社内DBから書き出した過去の年末年始出勤データをFirestoreへ一括投入するスクリプト。
// Firebase Admin SDK はセキュリティルールをバイパスできるため、通常のアプリ操作では
// 書けない workRecords を、初期データ移行としてまとめて書き込むために使う。
//
// 使い方は README.md を参照。
//
//   node import-history.js --mode=summary --serviceAccount=./serviceAccountKey.json --file=./data/summary.csv
//   node import-history.js --mode=daily   --serviceAccount=./serviceAccountKey.json --file=./data/daily-logs.csv --periods=./data/periods.json
//
// --dryRun を付けると、Firestoreへの書き込みは行わず内容の確認だけ行う。

const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");

function parseArgs(argv) {
  const args = {};
  for (const raw of argv.slice(2)) {
    const match = raw.match(/^--([^=]+)(?:=(.*))?$/);
    if (!match) continue;
    args[match[1]] = match[2] === undefined ? true : match[2];
  }
  return args;
}

function parseWorked(value) {
  const normalized = String(value).trim().toLowerCase();
  if (["true", "1", "yes", "y", "出勤"].includes(normalized)) return true;
  if (["false", "0", "no", "n", "休暇", "休", "有休"].includes(normalized)) return false;
  throw new Error(`worked列の値が解釈できません: "${value}"`);
}

function loadEmployeeCodeMap(db) {
  return db
    .collection("employees")
    .get()
    .then((snapshot) => {
      const map = new Map();
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.employeeCode) {
          map.set(String(data.employeeCode).trim().toLowerCase(), doc.id);
        }
      });
      return map;
    });
}

function chunk(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

async function writeRecords(db, records, dryRun) {
  console.log(`\n書き込み対象: ${records.length}件`);
  if (dryRun) {
    console.log("(--dryRun のため実際の書き込みは行いません)");
    for (const record of records.slice(0, 20)) {
      console.log(" ", JSON.stringify(record));
    }
    if (records.length > 20) console.log(`  ...ほか${records.length - 20}件`);
    return;
  }

  for (const batchRecords of chunk(records, 400)) {
    const batch = db.batch();
    for (const record of batchRecords) {
      const ref = db
        .collection("employees")
        .doc(record.employeeId)
        .collection("workRecords")
        .doc(String(record.fiscalYear));
      batch.set(ref, record, { merge: true });
    }
    await batch.commit();
    console.log(`  ${batchRecords.length}件コミット完了`);
  }
}

// --mode=summary: 社員コード・年度ごとに「出勤/休暇取得」が既に集計済みのCSV
// 例: employeeCode,fiscalYear,worked
async function runSummaryMode(db, args) {
  const csvPath = args.file;
  if (!csvPath) throw new Error("--file=<summary.csvのパス> を指定してください");

  const rows = parse(fs.readFileSync(csvPath, "utf8"), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  const codeMap = await loadEmployeeCodeMap(db);
  const records = [];
  const unmatched = new Set();

  for (const row of rows) {
    const code = String(row.employeeCode || "").trim().toLowerCase();
    const uid = codeMap.get(code);
    if (!uid) {
      unmatched.add(row.employeeCode);
      continue;
    }
    const fiscalYear = Number(row.fiscalYear);
    if (!Number.isInteger(fiscalYear)) {
      throw new Error(`fiscalYearが不正です: ${JSON.stringify(row)}`);
    }
    records.push({
      id: `${uid}_${fiscalYear}`,
      employeeId: uid,
      fiscalYear,
      worked: parseWorked(row.worked),
    });
  }

  if (unmatched.size > 0) {
    console.warn(
      `\n[警告] employees コレクションに見つからない employeeCode が${unmatched.size}件ありました(スキップ済み):`
    );
    console.warn("  " + Array.from(unmatched).join(", "));
    console.warn("  先にFirebase側に社員アカウント・employeesドキュメントを作成してください。");
  }

  await writeRecords(db, records, args.dryRun);
}

// --mode=daily: 日次の勤怠ログ(出勤した日だけの行)から、年末年始期間ごとに
// 「その期間に1日でも出勤していれば worked=true」を算出する。
// 例: employeeCode,date (YYYY-MM-DD)
// periods.json 例: { "2023": { "start": "2022-12-29", "end": "2023-01-03" }, ... }
async function runDailyMode(db, args) {
  const csvPath = args.file;
  const periodsPath = args.periods;
  if (!csvPath) throw new Error("--file=<daily-logs.csvのパス> を指定してください");
  if (!periodsPath) throw new Error("--periods=<periods.jsonのパス> を指定してください(年度ごとの期間定義)");

  const rows = parse(fs.readFileSync(csvPath, "utf8"), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
  const periods = JSON.parse(fs.readFileSync(periodsPath, "utf8"));

  const codeMap = await loadEmployeeCodeMap(db);
  const unmatched = new Set();

  // employeeCode(小文字) -> fiscalYear -> attended(true/false)
  const attendance = new Map();
  for (const code of codeMap.keys()) {
    attendance.set(code, new Map(Object.keys(periods).map((year) => [Number(year), false])));
  }

  for (const row of rows) {
    const code = String(row.employeeCode || "").trim().toLowerCase();
    if (!codeMap.has(code)) {
      unmatched.add(row.employeeCode);
      continue;
    }
    const date = row.date;
    for (const [yearStr, range] of Object.entries(periods)) {
      if (date >= range.start && date <= range.end) {
        attendance.get(code).set(Number(yearStr), true);
      }
    }
  }

  if (unmatched.size > 0) {
    console.warn(
      `\n[警告] employees コレクションに見つからない employeeCode が${unmatched.size}件ありました(スキップ済み):`
    );
    console.warn("  " + Array.from(unmatched).join(", "));
  }

  const records = [];
  for (const [code, uid] of codeMap.entries()) {
    const yearMap = attendance.get(code);
    for (const [fiscalYear, worked] of yearMap.entries()) {
      records.push({
        id: `${uid}_${fiscalYear}`,
        employeeId: uid,
        fiscalYear,
        worked,
      });
    }
  }

  console.log(
    "\n[注意] このモードは「対象期間中に出勤ログが1件もない = その年は休暇を取得できた」とみなします。" +
      "勤怠ログの取得漏れがあると誤った履歴になるため、書き込み前に --dryRun の出力を必ず確認してください。"
  );

  await writeRecords(db, records, args.dryRun);
}

async function main() {
  const args = parseArgs(process.argv);
  const mode = args.mode || "summary";
  if (!args.serviceAccount) {
    throw new Error(
      "--serviceAccount=<serviceAccountKey.jsonのパス> を指定してください(README.md参照)"
    );
  }

  const admin = require("firebase-admin");
  const serviceAccount = JSON.parse(
    fs.readFileSync(path.resolve(args.serviceAccount), "utf8")
  );
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  const db = admin.firestore();

  if (mode === "summary") {
    await runSummaryMode(db, args);
  } else if (mode === "daily") {
    await runDailyMode(db, args);
  } else {
    throw new Error(`不明な --mode です: ${mode} (summary または daily)`);
  }

  console.log("\n完了しました。");
  process.exit(0);
}

main().catch((error) => {
  console.error("\nエラー:", error.message);
  process.exit(1);
});
