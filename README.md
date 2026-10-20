# あきんどカルタ 週めくりカレンダー — デスクトップウィジェット

Windows のデスクトップに常駐する、週めくりカレンダー兼カルタ表示アプリです。
Tauri v2 で作られています。Node.js は使いません。

---

## 1. ビルドに必要なもの（Windows 側で一度だけ）

| 必要なもの | 入手先 |
|---|---|
| Rust（rustup） | https://rustup.rs |
| Microsoft C++ Build Tools | Visual Studio Installer →「C++ によるデスクトップ開発」 |
| WebView2 | Windows 11 は標準搭載。Windows 10 は https://developer.microsoft.com/microsoft-edge/webview2/ |

Rust を入れたら、コマンドプロンプトで Tauri CLI を入れます。

```
cargo install tauri-cli --version "^2"
```

## 2. 動作確認

このフォルダで実行します。ウィンドウが立ち上がれば成功です。

```
cargo tauri dev
```

## 3. 配布ファイルを作る

```
cargo tauri build
```

出来上がりは以下に入ります。

```
src-tauri\target\release\あきんどカルタ週めくりカレンダー.exe   ← 単体で動く本体
src-tauri\target\release\bundle\nsis\***-setup.exe              ← インストーラ
```

**配布はこの exe 単体で完結します。** ダブルクリックすれば起動し、削除したければファイルを消すだけです。
インストーラ版が要らない場合は `tauri.conf.json` の `bundle.active` を `false` にしてください。

---

## 4. 使い方

| 操作 | 動作 |
|---|---|
| 上部のバーをドラッグ | ウィンドウを移動 |
| `札一覧` | 46札の一覧。クリックでその週へ移動 |
| `‹` `今週` `›` | 週の移動 |
| `小 / 中 / 大` | 表示サイズの切り替え（ウィンドウの端をドラッグして自由に変えることもできます） |
| `－` | 最小化（絵札と解説を畳む） |
| `前` | 常に最前面の切り替え |
| `✕` | 終了 |

同じ `src` フォルダをそのままWebサーバ（GitHub Pages など）に置くと、ブラウザ版（PC・スマホ対応）として動きます。

## 5. データの保存先

```
%APPDATA%\jp.denzaburo.akindo-karuta\ui.json         表示サイズなどの設定
```

ウィンドウの位置と大きさは `tauri-plugin-window-state` が自動で覚えます。

## 6. Windows 起動時に自動で立ち上げる

通知領域のアイコンを右クリック →「Windows起動時に開く」をオンにしてください。
立ち上がらないときは Windows の「設定 → アプリ → スタートアップ」で「あきんどカルタ」がオフになっていないか確認してください。

## 7. 中身を差し替える

| 差し替えたいもの | 場所 |
|---|---|
| 読み札・解説・リンク | `src/cards.json` |
| 絵札の画像 | `src/assets/fuda/wNN.jpg` |
| ロゴ | `src/assets/logo.png` |
| 配色・レイアウト | `src/app.css` |
| 動き | `src/app.js` |

`cards.json` は配列で、**添字がそのまま週番号**です（`[0]` は表紙で未使用、`[1]` が第1週）。

```json
{
  "yomi": "あかんモンはあかん",
  "kaisetsu": "解説文…",
  "img": "assets/fuda/w04.jpg",
  "wide": false,
  "url": "https://…",
  "logo": true,
  "plain": true
}
```

- `yomi` が空の週は、絵札を横幅いっぱいに表示します
- `url` を入れると「▶ YouTubeで聴く」ボタンが出ます
- `logo` を `true` にすると本文の下に小さくロゴが入ります
- `plain` は第1週のように、画像を小さく中央に置きたいときに使います

## 8. 年をまたぐとき

`src/app.js` の先頭付近にある基準日を差し替えてください。

```js
const A = new Date(2026, 0, 5);   // 第2週の月曜日
```

`dates()` 内の年始・年末の扱いも合わせて調整が必要です。

---

## 補足：SmartScreen の警告について

コード署名証明書を付けていない exe は、初回起動時に
「WindowsによってPCが保護されました」という警告が出ます。
`詳細情報` → `実行` で起動できます。配布ページにこの手順を書き添えてください。

## 8. Web版（GitHub Pages）

`src` がそのまま Web版です。GitHub に置くと自動で公開されます。

1. GitHub でリポジトリを作る（例：`akindo-karuta`、Private でも可）。
2. このフォルダ（`akindo`）の中身を push する（`.github/workflows/pages.yml` が入っていること）。
3. リポジトリの Settings → Pages → Build and deployment の Source を **GitHub Actions** にする。
4. 1〜2分で `https://<アカウント名>.github.io/<リポジトリ名>/` で開ける。

以後は `src` を直して push するだけで更新されます。Widget と Web版は同じファイルなので、中身の差し替えは1回で両方に効きます。
更新直後の10分ほどは古い表示が出ることがあります（GitHub Pagesのキャッシュ）。少し待って開き直せば最新になります。

スマホでは、ブラウザの「ホーム画面に追加」（iPhone：Safariの共有ボタン／Android：Chromeのメニュー）でアプリのように開けます。
