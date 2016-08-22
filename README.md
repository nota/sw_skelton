# service worker testアプリ

## 目的

- オフラインでも動作するウェブアプリを作る
- オンライン時の利用でも超高速に動作するようなウェブアプリを作る

## キャッシュする範囲

ユーザーデータのキャッシュに関しては、service workerでは担当しない。
アプリで使うアセット類(html, js, css, img, font） のみをローカルにキャッシュする

※将来的には、ユーザーの画像データ（http://gyazo.com/xxx.pngなど）
もservice workerでキャッシュしたい

## オフライン動作

オフライン時はキャッシュを表示する

## オンラインの動作

ページを開いた時に、キャッシュ版があれば、まずそれを表示する
更新があれば、ユーザーに、「新しい機能が利用できます」などの表示し、
リロードを促す（だが、キャンセルも可能）

メッセージは、モーダルではなく、バルーンメッセージにしたい

利用中であっても、更新を検知して、そのメッセージを表示したい

## 困っている点

タブのリロードでは、新しいservice workerが有効にならない！

## 確認

cache.allが失敗するとどうなるか？
-> installが成功しないので、activateされない。以後、ずっと前のservice workerが利用される



## デバッグ方法

殺し方
chrome://serviceworker-internals/
でunregisterできる

ローカルでservice workerを常に無効にする方法
Update on reloadにチェックを入れておく
https://www.chromium.org/blink/serviceworker/service-worker-faq
厳密には無効にするのではなく、毎回sw.jsを取りに行く。

## 有効そうな情報

The offline cookbook
https://jakearchibald.com/2014/offline-cookbook/
キャッシュのパターン別にサンプルコードの解説がある


まず、どう使うかざっくり把握できる？
http://qiita.com/horo/items/175c8fd7513138308930


