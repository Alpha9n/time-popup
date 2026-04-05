# 時限ポップアップ Chrome拡張機能 - UI/UXデザイン仕様書

## 1. ツールチップデザイン

### 表示位置
- テキスト（"n限", "n限目"）の**直上**に表示
- テキストとの間隔: 6px
- テキストの中央に水平方向で揃える
- 画面端にはみ出る場合は自動的に位置を調整（左右反転・下側表示）

### サイズ・余白
- パディング: 6px 12px
- 最小幅: なし（コンテンツに合わせる）
- 角丸: 6px

### フォント・文字サイズ
- フォント: `system-ui, -apple-system, "Hiragino Sans", "Yu Gothic UI", sans-serif`
- 文字サイズ: 13px
- フォントウェイト: 500（medium）
- 行高: 1.4

### 色・ボーダー
- 背景色: `#1a1a2e`（ダークネイビー）
- テキスト色: `#ffffff`
- ボーダー: なし
- ボックスシャドウ: `0 2px 8px rgba(0, 0, 0, 0.2)`

### アニメーション
- フェードイン: 150ms ease-out（ホバー後200ms遅延）
- フェードアウト: 100ms ease-in（カーソル離脱後即時）

### 表示フォーマット
```
1限目: 9:00 〜 10:30
```
- 「n限目」部分はやや太字（600）
- 「〜」の前後にスペース

### ツールチップCSS

```css
.jigen-tooltip {
  position: absolute;
  z-index: 2147483647;
  padding: 6px 12px;
  border-radius: 6px;
  background-color: #1a1a2e;
  color: #ffffff;
  font-family: system-ui, -apple-system, "Hiragino Sans", "Yu Gothic UI", sans-serif;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.4;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  pointer-events: none;
  opacity: 0;
  transition: opacity 150ms ease-out;
}

.jigen-tooltip.visible {
  opacity: 1;
}

.jigen-tooltip .period-label {
  font-weight: 600;
}
```

---

## 2. ポップアップ画面

拡張機能アイコンクリック時に表示される小窓（幅300px）。

### レイアウト

```
┌─────────────────────────┐
│  時限ポップアップ        │  ← ヘッダー
├─────────────────────────┤
│                         │
│  有効 [━━━━○]  ON/OFF   │  ← トグルスイッチ
│                         │
│  現在のサイト:           │
│  ○ 対象 / ✕ 対象外      │  ← 現在のサイトがマッチしているか
│                         │
├─────────────────────────┤
│  ⚙ 設定を開く           │  ← オプション画面への導線
└─────────────────────────┘
```

### デザイン仕様
- 幅: 300px
- パディング: 16px
- ヘッダー: フォントサイズ16px, weight 700
- トグルスイッチ: 40px x 22px, ON時は `#4f46e5`（インディゴ）
- 対象サイト表示: マッチ時は緑チェック `#22c55e`, 非マッチ時はグレー `#9ca3af`
- 「設定を開く」リンク: フォントサイズ13px, 色 `#4f46e5`

### ポップアップCSS

```css
/* ポップアップ全体 */
.popup-container {
  width: 300px;
  padding: 16px;
  font-family: system-ui, -apple-system, "Hiragino Sans", "Yu Gothic UI", sans-serif;
  background: #ffffff;
  color: #1a1a2e;
}

/* ヘッダー */
.popup-header {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* トグルスイッチ */
.toggle-switch {
  position: relative;
  width: 40px;
  height: 22px;
  background: #d1d5db;
  border-radius: 11px;
  cursor: pointer;
  transition: background 200ms;
}

.toggle-switch.active {
  background: #4f46e5;
}

.toggle-switch::after {
  content: "";
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  background: #ffffff;
  border-radius: 50%;
  transition: transform 200ms;
}

.toggle-switch.active::after {
  transform: translateX(18px);
}

/* 対象サイト表示 */
.site-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #6b7280;
  margin: 12px 0;
}

.site-status.matched {
  color: #22c55e;
}

/* 設定リンク */
.settings-link {
  display: block;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
  font-size: 13px;
  color: #4f46e5;
  text-decoration: none;
  cursor: pointer;
}

.settings-link:hover {
  text-decoration: underline;
}
```

---

## 3. オプション（設定）画面

`chrome.runtime.openOptionsPage()` で開く全画面設定ページ。

### レイアウト

```
┌───────────────────────────────────────────┐
│  時限ポップアップ 設定                      │
├───────────────────────────────────────────┤
│                                           │
│  ■ 対象サイト                              │
│  ┌───────────────────────────┬────┬────┐  │
│  │ https://example.ac.jp/*  │ 編集│ 削除│  │
│  ├───────────────────────────┼────┼────┤  │
│  │ https://portal.univ.jp/* │ 編集│ 削除│  │
│  └───────────────────────────┴────┴────┘  │
│  [+ サイトを追加]                          │
│                                           │
│  ■ 時限設定                                │
│  時限数: [7 ▾]  (1〜15)                    │
│                                           │
│  │ 時限 │ 開始  │ 終了  │                  │
│  │ 1限  │ 09:00 │ 10:30 │                  │
│  │ 2限  │ 10:40 │ 12:10 │                  │
│  │ 3限  │ 13:00 │ 14:30 │                  │
│  │ 4限  │ 14:40 │ 16:10 │                  │
│  │ 5限  │ 16:20 │ 17:50 │                  │
│  │ 6限  │ 18:00 │ 19:30 │                  │
│  │ 7限  │ 19:40 │ 21:10 │                  │
│                                           │
│  [デフォルトに戻す]                         │
│  [エクスポート] [インポート]                │
│  [保存]                                    │
└───────────────────────────────────────────┘
```

### デザイン仕様

- 最大幅: 640px, 中央揃え
- パディング: 32px
- セクション間のマージン: 24px
- 入力フィールド: 高さ36px, ボーダー `#d1d5db`, フォーカス時 `#4f46e5`
- 時刻入力: `<input type="time">` を使用
- 時限数セレクト: `<select>` ドロップダウン、1〜15の選択肢
- 対象サイト行: 「編集」ボタンでインライン編集モード切替、「削除」ボタンで行削除
- 削除ボタン: ホバー時に赤 `#ef4444`
- 編集ボタン: テキストボタン、色 `#4f46e5`
- 「保存」ボタン: 背景 `#4f46e5`, テキスト白, パディング 8px 24px, 角丸 6px
- 「デフォルトに戻す」ボタン: 背景白, ボーダー `#d1d5db`, テキスト `#6b7280`
- 「エクスポート」「インポート」ボタン: テキストボタン、色 `#6b7280`, フォントサイズ 13px

### オプション画面CSS

```css
/* 設定画面全体 */
.options-container {
  max-width: 640px;
  margin: 0 auto;
  padding: 32px;
  font-family: system-ui, -apple-system, "Hiragino Sans", "Yu Gothic UI", sans-serif;
  color: #1a1a2e;
}

.options-container h1 {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 24px;
}

/* セクション */
.section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 12px;
}

/* 対象サイトリスト */
.site-list-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.site-list-item input[type="text"] {
  flex: 1;
  height: 36px;
  padding: 0 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  outline: none;
  transition: border-color 150ms;
}

.site-list-item input[type="text"]:focus {
  border-color: #4f46e5;
  box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.15);
}

/* 対象サイト編集・削除ボタン */
.btn-edit {
  padding: 4px 8px;
  border: none;
  background: none;
  color: #4f46e5;
  font-size: 13px;
  cursor: pointer;
  border-radius: 4px;
  transition: background 150ms;
}

.btn-edit:hover {
  background: rgba(79, 70, 229, 0.1);
}

/* 時限数セレクト */
.period-count-select {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  font-size: 14px;
}

.period-count-select select {
  height: 36px;
  padding: 0 8px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  cursor: pointer;
  transition: border-color 150ms;
}

.period-count-select select:focus {
  border-color: #4f46e5;
  box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.15);
}

/* 時限設定テーブル */
.period-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.period-label {
  width: 40px;
  font-size: 14px;
  font-weight: 500;
  text-align: center;
}

.period-row input[type="time"] {
  height: 36px;
  padding: 0 8px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  outline: none;
  transition: border-color 150ms;
}

.period-row input[type="time"]:focus {
  border-color: #4f46e5;
  box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.15);
}

.period-separator {
  color: #9ca3af;
  font-size: 13px;
}

/* 削除ボタン */
.btn-delete {
  width: 28px;
  height: 28px;
  border: none;
  background: none;
  color: #9ca3af;
  font-size: 16px;
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 150ms, background 150ms;
}

.btn-delete:hover {
  color: #ef4444;
  background: #fef2f2;
}

/* 追加ボタン */
.btn-add {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: 1px dashed #d1d5db;
  border-radius: 6px;
  background: none;
  color: #6b7280;
  font-size: 13px;
  cursor: pointer;
  transition: border-color 150ms, color 150ms;
}

.btn-add:hover {
  border-color: #4f46e5;
  color: #4f46e5;
}

/* アクションボタン群 */
.actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
  flex-wrap: wrap;
  align-items: center;
}

.btn-save {
  padding: 8px 24px;
  background: #4f46e5;
  color: #ffffff;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 150ms;
}

.btn-save:hover {
  background: #4338ca;
}

.btn-default {
  padding: 8px 24px;
  background: #ffffff;
  color: #6b7280;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: border-color 150ms;
}

.btn-default:hover {
  border-color: #9ca3af;
}

/* エクスポート/インポートボタン */
.btn-text {
  padding: 4px 8px;
  border: none;
  background: none;
  color: #6b7280;
  font-size: 13px;
  cursor: pointer;
  text-decoration: underline;
  transition: color 150ms;
}

.btn-text:hover {
  color: #4f46e5;
}
```

---

## 4. CSS設計方針

### カラーパレット（CSS変数）

```css
:root {
  /* プライマリ */
  --color-primary: #4f46e5;
  --color-primary-hover: #4338ca;
  --color-primary-light: rgba(79, 70, 229, 0.15);

  /* テキスト */
  --color-text: #1a1a2e;
  --color-text-secondary: #6b7280;
  --color-text-muted: #9ca3af;

  /* 背景 */
  --color-bg: #ffffff;
  --color-bg-tooltip: #1a1a2e;

  /* ボーダー */
  --color-border: #d1d5db;
  --color-border-light: #e5e7eb;

  /* ステータス */
  --color-success: #22c55e;
  --color-danger: #ef4444;
  --color-danger-bg: #fef2f2;

  /* シャドウ */
  --shadow-tooltip: 0 2px 8px rgba(0, 0, 0, 0.2);
  --shadow-focus: 0 0 0 2px var(--color-primary-light);

  /* 角丸 */
  --radius-sm: 4px;
  --radius-md: 6px;

  /* フォント */
  --font-family: system-ui, -apple-system, "Hiragino Sans", "Yu Gothic UI", sans-serif;
}
```

### 設計原則

1. **シンプルさ**: 最小限のUI要素で直感的に操作できること
2. **一貫性**: 全画面でカラーパレット・フォント・角丸を統一
3. **アクセシビリティ**: コントラスト比4.5:1以上、フォーカス時のアウトライン表示
4. **ページへの非干渉**: ツールチップは Shadow DOM 内に配置し、ページのCSSとの干渉を防止。z-index最大値を使用
5. **日本語最適化**: 日本語フォントファミリーを優先指定
