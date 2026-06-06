# MemoFlip

表面の問題に対して裏面の回答が表示される、単語カード型 UI の静的 Web アプリです。
Google Drive から問題集（JSON）を取り込み、フリップカードで自己採点しながら学習し、
演習履歴を IndexedDB に保存して Google Drive へ同期します。

## 技術スタック

- TypeScript (ES6, strict) + Parcel 2
- Vanilla TS + DOM API（UI フレームワークなし）
- Tailwind CSS 3 + PostCSS
- Redux 風 Reducer（`Model` + `Action` + `update()`）による状態管理
- IndexedDB（永続化）+ LocalStorage（設定）
- Google Drive API v3 + Google Identity Services (GIS)
- ESLint (flat config) + Prettier
- GitHub Pages へ GitHub Actions でデプロイ

## 開発

```bash
npm install
npm start        # 開発サーバ起動
npm run build    # public/ へ本番ビルド
npm run lint     # ESLint
npm run lint:fix # ESLint 自動修正
```

## 使い方

1. Google Cloud で OAuth クライアント ID（種類: ウェブアプリケーション）を作成し、
   承認済みの JavaScript 生成元にアプリの URL を登録します。
2. 問題集 JSON（[docs/drive-format.md](docs/drive-format.md) 参照）を Google Drive の
   任意フォルダに置きます。
3. アプリの ⚙️ 設定から **Client ID** と **フォルダ ID** を入力し、「Drive から取り込む」を実行します。
4. 問題集を選んで学習（出題順・出題範囲を選択 → フリップ → ◯/✗ で自己採点）。
5. 📊 から演習履歴を確認できます。設定で自動同期を ON にすると、演習終了時に履歴が Drive と同期されます。

## 進捗

- [x] Phase 1: プロジェクト基盤（ビルド / Lint / Tailwind / CI / MVC 雛形）
- [x] Phase 2: IndexedDB データ層・Drive JSON スキーマ・取り込みサービス
- [x] Phase 3: Google 認証・フォルダ取り込み・設定・問題集一覧
- [x] Phase 4: フリップカード演習・自己採点・出題順/範囲フィルタ・結果
- [x] Phase 5: 解答記録・履歴画面・Drive 同期
- [x] Phase 6: ダークモード・トースト・レスポンシブ・デプロイ確認
