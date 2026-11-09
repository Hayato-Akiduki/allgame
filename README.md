# ALLGAME

自作ゲームをまとめて遊べるサイトです。

**公開ページ：https://hayato-akiduki.github.io/allgame/**

`main` ブランチに push すると、GitHub Actions がサイトを組み立てて GitHub Pages に公開します（1分ほどで反映）。

## このPCで表示を確認する

```bash
npm run site:serve
```

http://localhost:8800 で表示できます（Ctrl+C で終了）。組み立てるだけなら `npm run site` です。追加のインストールは不要で、Node.js だけで動きます。

## 構成

| ファイル | 役割 |
|---|---|
| `site/games.js` | ゲーム一覧（タイトル・絵文字・色・セーブ名など） |
| `site/index.html` | トップページ（ゲーム機のホーム画面風） |
| `site/hub.js` | 各ゲームに自動で読み込ませる共通スクリプト（一覧へ戻るタブ・プレイ記録） |
| `site/dashboard.js` | プレイ記録・進み具合・スタンプの計算 |
| `site/backup.js` | セーブの書き出し・読み込み |
| `scripts/build-site.js` | 上のファイルとゲームを `site-dist/` に組み立てる |
| `scripts/serve-site.js` | このPCで表示確認するための小さなサーバー |
| `.github/workflows/pages.yml` | push したら自動で公開する設定 |
| `build/icon.svg`, `build/icon.png` | アイコン |

元のゲームファイル（`*.html`、各ゲームのフォルダ）は変えずに使います。組み立てるとき、各ゲームは `/<id>/index.html` に置かれ、共通スクリプトが読み込まれます。

## トップページ

- ←→ でゲームを選び Enter で遊ぶ、↓ でメニュー（スタンプ・きろく・セーブ・そうさ方法）、Esc で閉じる。
- コントローラー（十字キー・スティックで移動、A 決定、B 戻る）とマウス（ホイール・クリック）でも操作できます。
- 最近遊んだゲームが左に来ます。
- ゲームの中では、画面上端の中央にマウスを近づけると「◀ ALLGAME」タブが下りてきて、一覧に戻れます。

## 記録・スタンプ・セーブ

どれもブラウザの localStorage に保存されます（ブラウザごとに別々）。

- **プレイ記録**（`allgame-stats`）：回数・時間・最後に遊んだ日時・遊んだ日。時間は直近1分に操作があった間だけ数えます。
- **進み具合**：各ゲームのセーブデータから1行で出します（読むだけで書き換えません）。出し方は `site/dashboard.js` の `PROGRESS`。
- **スタンプ**（`allgame-stamps`）：ゲームごと10個＋共通6個。条件と目標の数字は `site/dashboard.js` の `GAME_STAMPS`・`COMMON_STAMPS`。一度取ったスタンプはセーブを消しても残ります。
- **セーブの書き出し・読み込み**：全ゲームのセーブを1つの JSON ファイルにまとめて保存・復元します。github.io の同じアドレスには他のサイトのデータもあるので、`site/games.js` の `saveKeys` に書いた名前のセーブだけを扱います。

## ゲームを追加する

1. ゲームのファイルをこのフォルダに置く（フォルダ入りでも、HTML 1枚でもよい）
2. `site/games.js` に1行足す（`id`・`path`・`icon`・`color`・`saveKeys` など）
3. 必要なら `site/dashboard.js` の `PROGRESS` と `GAME_STAMPS` に、そのゲームの進み具合とスタンプを足す
4. `npm run site:serve` で確認して push する

別のサイトにあるゲーム（ミニゲームランドなど）は、`path` の代わりに `webUrl` を書くとリンクとして並びます。
