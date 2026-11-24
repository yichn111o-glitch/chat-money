シフト給料カレンダー（HTML / CSS / JavaScript）

ファイル
  index.html            画面
  style.css             デザイン
  app.js                動作（JavaScript）
  manifest.webmanifest  ホーム画面に追加するための設定（アプリ名・アイコン）
  sw.js                 オフライン用の設定（Service Worker）
  apple-touch-icon.png / icon-192.png / icon-512.png / icon-maskable-512.png / favicon-32.png
                        お財布のアイコン画像（フォルダに入れず、同じ階層に置きます）

そのまま開く場合
  index.html をブラウザで開くと使えます（ホーム画面への追加はできません）。

ホーム画面に追加する場合
  フォルダ一式を https:// で公開できる場所に置きます
  （例：GitHub Pages、Netlify、Cloudflare Pages など。無料で使えます）。
  公開したURLをスマホで開いて、次の操作をします。
    iPhone  ：Safari の共有ボタン →「ホーム画面に追加」
    Android ：Chrome のメニュー →「ホーム画面に追加」または「アプリをインストール」
  お財布のアイコンで、アプリのように全画面で起動します。
  ※ file:// や http:// では、アイコン設定やオフライン動作が効かないことがあります。

データの保存先
  シフト・受け取り履歴 ... ブラウザの localStorage
  明細PDF ................. ブラウザの IndexedDB
  使っている端末・ブラウザ内に保存されます。別の端末とは共有されません。
  ブラウザの閲覧データを消すと、記録も消えます。
  ホーム画面のアプリとブラウザでは、データが別々になる場合があります
  （特にiPhone）。使う入口はどちらかに決めてください。

アプリを更新したとき
  sw.js の先頭にある CACHE の名前（shiftpay-v1）を変えると、
  古い表示が残らず新しい内容に切り替わります。
