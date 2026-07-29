import assert from "node:assert/strict";
import test from "node:test";
import { renderPackageMarkdown } from "./markdown.ts";

const baseUrl = "https://raw.githubusercontent.com/Neosku/aviutl2-catalog-data/main/md/example.md";

test("GitHub Alertを日本語タイトル付きで描画する", () => {
  const html = renderPackageMarkdown("> [!WARNING]\n> 注意してください。", baseUrl);
  assert.match(html, /class="markdown-alert markdown-alert-warning"/);
  assert.match(html, />警告</);
  assert.match(html, /注意してください。/);
});

test("details内のMarkdownを描画し危険なHTMLを除去する", () => {
  const html = renderPackageMarkdown(
    "<details open>\n<summary>詳細</summary>\n\n**太字**\n<script>alert(1)</script>\n</details>",
    baseUrl,
  );
  assert.match(html, /<details open="">/);
  assert.match(html, /<summary>詳細<\/summary>/);
  assert.match(html, /<strong>太字<\/strong>/);
  assert.doesNotMatch(html, /<script>/);
});

test("画像はプロキシし相対リンクはGitHubのblob URLへ変換する", () => {
  const html = renderPackageMarkdown("[詳細](guide.md)\n\n![画像](../image/example.png)", baseUrl);
  assert.match(
    html,
    /href="https:\/\/github\.com\/Neosku\/aviutl2-catalog-data\/blob\/main\/md\/guide\.md"/,
  );
  assert.match(html, /src="\/api\/raw\/Neosku\/aviutl2-catalog-data\/main\/image\/example\.png"/);
});

test("画像バッジだけの段落へ専用クラスを付与する", () => {
  const html = renderPackageMarkdown(
    "[![Build](https://example.com/badge.svg)](https://example.com)",
    baseUrl,
  );
  assert.match(html, /<p class="markdown-badges">/);
});

test("参照元と同様に改行・打ち消し線・コードフェンスを描画する", () => {
  const html = renderPackageMarkdown(
    "1行目\n2行目\n\n~~削除~~\n\n```typescript\nconst value = 1;\n```",
    baseUrl,
  );
  assert.match(html, /1行目<br>\n2行目/);
  assert.match(html, /<s>削除<\/s>/);
  assert.match(html, /<code class="language-typescript">const value = 1;\n<\/code>/);
});

test("プレーンURLを自動リンク化しない", () => {
  const html = renderPackageMarkdown("https://example.com", baseUrl);
  assert.equal(html, "<p>https://example.com</p>");
});

test("許可されたHTML要素と属性だけを保持する", () => {
  const html = renderPackageMarkdown(
    '<details open class="discarded"><summary>詳細</summary><dl><dt>項目</dt><dd>値</dd></dl></details><iframe src="https://example.com"></iframe>',
    baseUrl,
  );
  assert.equal(
    html,
    '<details open=""><summary>詳細</summary><dl><dt>項目</dt><dd>値</dd></dl></details>',
  );
});
