# Nicomedkey Konton Gacha Worker

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/NotLeonian/nicomedkey-konton-gacha-worker)

[nicomedkey.cc](https://nicomedkey.cc/) の混沌ぼっと（`@konton_freedom`）の混沌ガチャを自動で引く Cloudflare Worker です。

## できること

この Worker を有効にすると、`@konton_freedom 混沌ガチャ` を 2 時間ごとに自動で投稿します。
投稿時刻の目安は、日本時間の 00:01、02:01、04:01、…です。

混沌ぼっとからの返信に記載されたポイントが 3,600 ポイント以上なら、`@konton_freedom プレミアムポイントガチャ10連` を投稿します。
プレミアムポイントガチャを引いた後も 3,600 ポイント以上残っていれば、3,600 ポイント未満になるまで 10 連を続けます。

## 必要なもの

- Cloudflare アカウント
- nicomedkey.cc アカウント
- nicomedkey.cc API トークン

API トークンには、`write:notes` の権限だけを付与してください。

## デプロイ

ページ上部の `Deploy to Cloudflare` ボタンを押してください。

Cloudflare のセットアップ画面で、次の手順の設定を行います。

1. `NICOMEDKEY_TOKEN` に API トークンを入力します。
2. 自動投稿を有効にする場合は、`ENABLED` を `true` にします。
3. `Deploy` をクリックします。

D1 データベースは自動的に作成されます。

## 重複投稿を防ぐ仕組み

この Worker は、日本時間を基準に 2 時間ごとに区切った各時間帯に、通常ガチャを 1 回だけ投稿します。
投稿履歴を D1 データベースに保存し、同じ時間帯に重複して投稿することを防ぎます。

また、混沌ぼっとから届いた 1 件の返信をきっかけに、プレミアムポイントガチャを複数回投稿することはありません。

ネットワーク障害などにより、投稿に成功したかどうかを確認できない場合は、自動では再送しません。
この場合は `manual_review` 状態となり、手動で確認する必要があります。

## 稼働状況を確認する

デプロイ後、次の URL を開いてください。

https://YOUR-WORKER.workers.dev/health

`manualReview` の値が 0 なら、手動で確認する必要のある記録はありません。

## 注意事項

このプログラムは、混沌ぼっとが設けている「2 時間に 1 回」という制限を回避するものではありません。
混沌ぼっとから次に引ける時刻を案内された場合も、同じ時間帯には再投稿しません。

[nicomedkey.cc](https://nicomedkey.cc/) または混沌ぼっとの利用規約や運用方針が変更された場合は、変更後の内容に従い、必要に応じてこの Worker を停止してください。
