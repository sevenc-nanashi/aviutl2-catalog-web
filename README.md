# AviUtl2 Catalog Web

[AviUtl2 Catalog](https://github.com/Neosku/aviutl2-catalog) のWeb版ビューワー。

## 開発

```console
aube install
aube run dev
```

### GitHub Token寄付機能

寄付機能はGitHub OAuth App、Cloudflare D1、暗号化用のSecretを使用します。外部リソースのIDやSecretはリポジトリへコミットしません。

#### 1. GitHub OAuth Appを作成する

[GitHub Developer settings](https://github.com/settings/developers)からOAuth Appを作成します。追加のscopeは不要です。

- Homepage URL: 起動するサイトのURL
- Authorization callback URL: `<サイトのURL>/api/github/oauth/callback`

ローカル開発では、通常は以下を使用します。

```text
Homepage URL: http://localhost:3000
Authorization callback URL: http://localhost:3000/api/github/oauth/callback
```

GitHub OAuth Appに登録できるcallback URLは1件だけなので、ローカル開発用と本番用は別のAppを作成してください。

#### 2. D1を作成する

以下のコマンドでD1を作成し、`GITHUB_DONATIONS_DB` bindingを`wrangler.jsonc`へ追加します。

```console
aube exec wrangler d1 create aviutl2-catalog-web-donations \
  --binding GITHUB_DONATIONS_DB \
  --update-config
```

作成時に出力された実際のdatabase IDを使用し、ローカルと本番へmigrationを適用します。

```console
aube exec wrangler d1 migrations apply aviutl2-catalog-web-donations --local
aube exec wrangler d1 migrations apply aviutl2-catalog-web-donations --remote
```

#### 3. ローカル環境変数を設定する

`.dev.vars.example`を`.dev.vars`へコピーし、OAuth AppのClient IDとClient Secretを設定します。暗号鍵には32バイトのランダム値をBase64で設定します。

```console
openssl rand -base64 32
```

`GITHUB_TOKEN`は既存環境との互換用で、設定は任意です。GitHub APIの認証はOAuth App、`GITHUB_TOKEN`、寄付トークンの順に使用されます。

#### 4. 本番Secretを設定する

本番用OAuth Appの値と暗号鍵をCloudflare Workersへ設定します。

```console
aube exec wrangler secret put GITHUB_OAUTH_CLIENT_ID
aube exec wrangler secret put GITHUB_OAUTH_CLIENT_SECRET
aube exec wrangler secret put GITHUB_TOKEN_ENCRYPTION_KEY
```

設定とmigrationの適用後にデプロイしてください。D1 bindingまたはSecretがない環境では寄付APIが`503`を返しますが、既存のカタログ閲覧は引き続き利用できます。

### 確認

```console
aube run format
aube run lint
aube test
aube run build
```

## ライセンス

MIT Licenseで公開しています。

## 謝辞

このページは[AviUtl2 Catalog](https://github.com/Neosku/aviutl2-catalog)のデザインを参考にしています。

```
MIT License

Copyright (c) 2025 Neosku

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
