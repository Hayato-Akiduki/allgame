# ALLGAME（ゲーム詰め合わせアプリ）

このフォルダのゲームを 1 つの Windows アプリにまとめています。元のゲームファイルはそのまま使っています。

## 構成

| ファイル | 役割 |
|---|---|
| `package.json` | アプリ名・バージョン・インストーラー設定 |
| `app/main.js` | アプリ本体（ウィンドウ、メニュー、ゲームの読み込み） |
| `app/games.js` | ゲーム一覧（タイトル・ジャンル・色） |
| `app/menu/index.html` | ゲーム選択画面 |
| `app/vendor/` | オフライン用に同梱したライブラリ（three.js） |
| `dist/` | ビルドしたインストーラーの出力先 |

## サイト版

HTML のゲームをまとめた Web サイトも作れます（日本一周ドライブ3D は入りません。ミニゲームランドは公開中のサイトへのリンクになります）。
アプリとサイトは同じゲームファイルを使うので、ゲームを直せば両方に反映できます。

| コマンド | すること |
|---|---|
| `npm run site` | `site-dist/` にサイトを組み立てる |
| `npm run site:serve` | 組み立てて、このPCの http://localhost:8800 で表示確認する |
| `npm run site:deploy` | 組み立てて Cloudflare に公開する（`wrangler.jsonc` の設定。初回は Cloudflare へのログインが必要） |

- 各ゲームは `/<id>/`（例: `/cyber-arena/`）で開けます。ゲームの一覧と id は `app/games.js` です。
- サイトにはメニューバーがないので、ゲームからはブラウザの「戻る」で一覧に戻ります。
- 公開には `C:\Claude\minigame` に入っている wrangler を使っています。

## 試しに起動する（インストールせずに）

```bash
npm start
```

## インストーラーを作る

```bash
npm run dist
```

`dist/ALLGAME-Setup-<バージョン>.exe` ができます。これを配ってインストールしてもらいます。

## 更新の手順（手動更新）

1. ゲームの HTML などを修正する
2. `package.json` の `"version"` を上げる（例: `1.0.0` → `1.0.1`）
3. `npm run dist` でインストーラーを作り直す
4. 新しい `ALLGAME-Setup-1.0.1.exe` を配る
5. 受け取った人はそれを実行するだけで上書き更新されます（アンインストール不要）

セーブデータは更新しても残ります。

## ミニゲームランドについて

- 本体は `C:\Claude\minigame` にあります。`npm run dist` を実行すると、その `dist/client` が自動で `minigame/` にコピーされてから組み込まれます（コピーだけしたいときは `npm run sync`）。
- **オフライン版**として組み込んでいます。サーバーには一切つながりません。
- 本来サーバーが返すランキング等（`/api/*`）は、アプリ内の [app/local-api.js](app/local-api.js) が代わりに返します。
- 記録はこのPCの `%APPDATA%\ALLGAME\minigame-records.json` に保存され、ランキング画面には自分の記録（ゲーム別は自分の上位10件）が出ます。

## 日本一周ドライブ3D（exe のゲーム）について

- C# で作ったゲームなので、ALLGAME の画面の中ではなく**別ウィンドウで起動**します。カードを押すと起動し、その間 ALLGAME は最小化されます。ゲームを閉じると ALLGAME に戻ります。
- 本体は `C:\Claude\日本一周` にあります。`npm run dist` を実行すると、`C:\Claude\日本一周\配布\日本一周ドライブ3D` の exe が自動で `native/japandrive/` にコピーされてから組み込まれます（コピーだけしたいときは `npm run sync`）。
  - ゲームを更新したら、先に `C:\Claude\日本一周` で配布用の exe を作り直してください（`dotnet publish ... -o 配布\日本一周ドライブ3D`）。
- インストール先では `resources/native/japandrive/JapanDrive3D.exe` に置かれます（asar の外）。
- セーブデータはゲーム側の `%LOCALAPPDATA%\JapanDrive3D\save.json` に保存されます（ALLGAME の更新では消えません）。
- exe のゲームを増やすときは、`native/` にフォルダを置き、`app/games.js` に `native: true` をつけて追加します。

## ゲームを追加する

1. ゲームのファイルをこのフォルダに置く
2. `app/games.js` に 1 行追加する（`id` は英数字とハイフンだけ）
3. フォルダに入ったゲームなら、`package.json` の `build.files` にそのフォルダを追加する

## メモ

- コード署名をしていないため、初回インストール時に「Windows によって PC が保護されました」と出ます。「詳細情報」→「実行」で進めます。
- フォントは Google Fonts から読み込むため、オフライン時は代わりのフォントで表示されます（ゲームは動きます）。
- ブラウザで遊んでいたときのセーブデータは、アプリには引き継がれません。
- 将来 GitHub Releases を使った自動アップデートにしたい場合は、`electron-updater` を追加すれば対応できます。
