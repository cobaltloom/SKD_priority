# SKD Priority

「App in the Air」に似た、フライト旅程管理アプリです。React Native (Expo) 製のモバイルアプリで、登録したフライトの一覧管理・リアルタイムのフライト状況確認・旅行統計(飛行距離・飛行時間・訪問国数など)を確認できます。

## 主な機能

- ✈️ **フライト登録・一覧管理**: 便名・出発/到着空港(IATAコード)・搭乗日を登録し、旅程として一覧表示
- 🔄 **リアルタイムフライト状況**: [AviationStack](https://aviationstack.com/) API と連携し、遅延・ゲート・ターミナル・搭乗口などの最新情報を取得
- 📊 **旅行統計**: 登録済みフライトから総飛行距離・総飛行時間・訪問国数・利用空港数を自動集計
- 🔐 フライトデータは端末内(AsyncStorage)に、APIキーは SecureStore に保存され、外部サーバーには送信されません

## 技術スタック

- [Expo](https://expo.dev/) (SDK 57) / React Native
- [Expo Router](https://expo.github.io/router/) によるファイルベースルーティング
- [Zustand](https://github.com/pmndrs/zustand) による状態管理
- `@react-native-async-storage/async-storage` / `expo-secure-store` によるローカル永続化
- AviationStack API (フライト実データ連携)

## セットアップ

```bash
npm install
npm run start   # Expo Go / シミュレータで起動
```

起動後、アプリ内の「設定」タブから [AviationStack の無料APIキー](https://aviationstack.com/signup/free) を登録すると、フライト詳細画面からリアルタイム状況を取得できます。APIキーがなくても、フライトの登録・一覧管理・旅行統計機能は利用できます。

## プロジェクト構成

```
app/                  expo-router のルート定義
  (tabs)/              タブ画面 (フライト一覧・旅行統計・設定)
  add-flight.tsx        フライト追加(モーダル)
  flight/[id].tsx        フライト詳細
src/
  api/aviationstack.ts   フライト状況API連携
  data/airports.ts       主要空港マスタ(IATA/座標)
  store/                 Zustand ストア(フライト・設定)
  utils/                 距離計算・統計集計・フォーマット
  types/                 型定義
```
