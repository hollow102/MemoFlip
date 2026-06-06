# Google Drive 問題集 JSON フォーマット

MemoFlip は、設定で指定した Google Drive フォルダ内の **JSON ファイル（1 ファイル = 1 問題集）** を
読み取り専用で取り込みます。各ファイルは次の形式です。

```jsonc
{
  "id": "toeic-600",            // 必須: 問題集の一意な ID（再取り込み時の更新キー）
  "name": "英単語 TOEIC 600",   // 必須: 表示名
  "description": "頻出英単語",   // 任意
  "version": 1,                  // 任意: 既定 1
  "updatedAt": "2026-06-01T00:00:00Z", // 任意: ISO 8601
  "cards": [                     // 必須: カード配列
    {
      "id": "c1",               // 必須: 問題集内で一意なカード ID
      "front": "<b>apple</b>",  // 必須: 表面（HTML 文字列）
      "back": "りんご<br>（果物）", // 必須: 裏面（HTML 文字列）
      "tags": ["noun", "food"]  // 任意: 絞り込み用タグ
    }
  ]
}
```

## 注意

- `front` / `back` は **HTML 文字列** として表示されます。取り込み時に
  [DOMPurify](https://github.com/cure53/DOMPurify) でサニタイズされ、危険なタグ/属性は除去されます。
- `id` が同じファイルを再取り込みすると、その問題集はカードごと最新内容に置き換えられます。
- ファイルの MIME タイプは `application/json`（または `application/octet-stream`）である必要があります。
  Google ドキュメント形式のファイルは対象外です。
- 取り込みには `drive.readonly`、履歴同期には `drive.file` の OAuth スコープを使用します。

サンプル: [sample-deck.json](sample-deck.json)
