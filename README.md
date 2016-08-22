# Service Worker オフラインアプリ

## 目的

- オフラインでも動作するウェブアプリを作る
- オンライン時の利用でも超高速に動作するようなウェブアプリを作る

## キャッシュする範囲

ユーザーデータのキャッシュに関しては、service workerでは担当しない。
アプリで使うアセット類(html, js, css, img, font） のみをローカルにキャッシュする

※将来的には、ユーザーの画像データ（http://gyazo.com/xxx.pngなど）
もservice workerでキャッシュしたい

## 動作方法

```
$ node server.js
```

localhost:2000にアクセスしてください。

## デバッグ方法

殺し方
Chromeの場合、以下のURLにアクセス

`chrome://serviceworker-internals/`

unregisterします。

ローカルでservice workerを常に無効にする方法

Update on reloadにチェックを入れておく
https://www.chromium.org/blink/serviceworker/service-worker-faq
厳密には無効にするのではなく、毎回sw.jsを取りに行く。

## 解説

https://gyazz-clone.herokuapp.com/Nota/オフラインアプリ
参照。

