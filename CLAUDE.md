# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

MemoFlip は単語カード型（表＝問題 / 裏＝回答）の静的 Web アプリ。Google Drive 上の JSON 問題集を
読み取り専用で取り込み、フリップカードで自己採点（◯/✗）し、演習履歴を IndexedDB に保存して
Google Drive へ同期する。UI フレームワークなしの Vanilla TS + DOM。

このプロジェクトは既存プロジェクト `oqoa`（TypeScript × Parcel × GitHub Pages のクイズアプリ）を
テンプレートとして踏襲している。アーキテクチャ判断に迷ったら oqoa の同等実装を参照する。

**ユーザーへの回答は日本語で行う。**

## Commands

```bash
npm start         # 開発サーバ（parcel src/resources/index.html、prestart で dist/.parcel-cache を削除）
npm run build     # public/ へ本番ビルド（--public-url ./ で相対パス）
npm run lint      # ESLint（flat config）
npm run lint:fix  # ESLint 自動修正
npx tsc --noEmit  # 型チェックのみ（Parcel は型を検査しないので別途実行する）
```

- テストランナーは無し。検証は `npm run lint` / `npx tsc --noEmit` / `npm run build` の 3 点で行う。
- import の並び順は `eslint-plugin-simple-import-sort` で強制される。新規 import を足したら
  `npm run lint:fix` で並べ替えること（並び崩れは lint エラーになる）。

## Architecture

Redux 風の単方向データフロー。**副作用は Controller のみが持ち、`update()` は純粋関数**という分離が要。

```
View (DOM/イベント) ──UIEvent──▶ Controller ──Action──▶ update() ──新Model──▶ View.render()
                                     │
                                     └─ runEffects / services（IndexedDB・Drive・LocalStorage）
```

- **Model** [src/app/models/index.ts](src/app/models/index.ts) — アプリ全体の状態ツリー（画面・テーマ・
  トースト・問題集・設定・演習/結果/履歴の状態）。エンティティ型は
  [src/app/models/entities/index.ts](src/app/models/entities/index.ts)。
- **update()** [src/app/updates/update.ts](src/app/updates/update.ts) — `(Model, Action) => Model` の純粋関数。
  Action 型は [src/app/updates/action_types.ts](src/app/updates/action_types.ts)。**ここに副作用を書かない。**
- **Controller** [src/app/controllers/controller.ts](src/app/controllers/controller.ts) — 司令塔。`dispatch()` が
  `update()` → `runEffects()` → `view.render()` を順に呼ぶ。UI イベントの購読、サービス呼び出し（async な副作用）、
  Action の発行を担う。`registerHandlers()` が UIEvent → ハンドラの配線の一覧。
- **View** [src/app/views/index.ts](src/app/views/index.ts) — `render(model)` で main に画面、modal-root にモーダル、
  toast-root にトーストを毎回 `innerHTML` 再描画する（差分なしの全置換）。動的要素は **`data-action` 属性 +
  イベント委譲**で扱い、`emit(UIEvent, payload)` で Controller に通知する。各画面は `renderXxx(model)` 関数
  （deck_view / study_view / result_view / history_view / setting_view）。UIEvent は
  [src/app/views/ui_event_types.ts](src/app/views/ui_event_types.ts)。
  - 全置換描画のため、入力中のフォーカス／キャレットは `renderScreen()` が同 id 要素へ手動復元する。
    新しい入力欄を足すときはこの前提に注意。

### データ層

- **IndexedDB** — スキーマ（4 ストア: decks / cards / sessions / card_results とインデックス）は
  [src/app/repositories/db.ts](src/app/repositories/db.ts)。スキーマ変更時は `DB_VERSION` を上げて
  `createStores()` を更新する。
- **BaseRepository** [src/app/repositories/base_repository.ts](src/app/repositories/base_repository.ts) — 1 ストアの
  汎用 CRUD（put による upsert 基本、bulkPut、index 経由の getAll/delete）。各 repository はこれを継承し
  シングルトンを export する。
- **Card の主キーは複合キー** `key = ${deckId}::${cardId}`（`cardKey()`）。`cardId` は問題集内のみで一意。
- **LocalStorage** [src/app/storages/index.ts](src/app/storages/index.ts) — 設定（Client ID / フォルダ ID /
  autoSync / テーマ / 最終デッキ）と Google アクセストークンのキャッシュ。

### Google Drive 連携

- **OAuth** は GIS（Google Identity Services、index.html で読み込み）。`getValidAccessToken()`
  [src/app/api/google_auth.ts](src/app/api/google_auth.ts) がトークンのキャッシュ再利用 → サイレント発行 →
  （interactive 時のみ）サインイン UI フォールバックを担う。スコープは取り込み=`drive.readonly`、
  履歴同期=`drive.file`。
- **取り込み**（読み取り専用）: `drive_import_service` → `drive_schema`（検証）→ `deck_import_service`。
  同 `id` の問題集を再取り込みすると**カードごと置き換え**（古いカードを delete してから bulkPut）。
- **front/back は HTML 文字列**。取り込み時に必ず [src/app/utils/sanitize.ts](src/app/utils/sanitize.ts)
  （DOMPurify）でサニタイズしてから保存する。Drive JSON フォーマットは
  [docs/drive-format.md](docs/drive-format.md)。
- **履歴同期** [src/app/services/history_sync_service.ts](src/app/services/history_sync_service.ts) —
  `memoflip-history.json` を介した id（UUID）単位の upsert ユニオンマージ。リモートを取り込んでから
  ローカル全体を書き戻す双方向同期。autoSync が ON なら演習終了時にサイレント同期する。

## 確定仕様（コードから読み取りにくい設計判断）

- 自己採点は ◯/✗ のみ（**SRS なし**）。出題は問題集（デッキ）単位。
- 出題順 = 登録順 / シャッフル。出題範囲 = 全件 / 誤答のみ / タグ・件数フィルタ。
- 問題集はアプリ内で編集しない（**Drive 読み取り専用**）。履歴のみ Drive 同期あり。
- Phase 1〜6 すべて実装済み（README の進捗参照）。

## デプロイ

`master` への push で [.github/workflows/deploy.yml](.github/workflows/deploy.yml) が `npm run build` →
`public/` を `gh-pages` ブランチへ公開。lint は別ワークフロー [.github/workflows/lint.yml](.github/workflows/lint.yml)。
