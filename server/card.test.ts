import assert from "node:assert/strict";
import test from "node:test";
import type { PackageInfo } from "../lib/catalog.ts";
import { renderCardHtml } from "./card.ts";

function createPackageInfo(): PackageInfo {
  return {
    id: "example.package",
    name: "Example Package",
    type: "汎用プラグイン",
    summary: "概要",
    description: "説明",
    author: "Author",
    repoURL: "https://github.com/example/package",
    "latest-version": "1.0.0",
    popularity: 0,
    trend: 0,
    licenses: [],
    tags: [],
    dependencies: [],
    images: [],
    installer: {
      source: { direct: "https://example.com/package.zip" },
      install: [],
      uninstall: [],
    },
    version: [],
  };
}

test("サムネイルがある場合は画像を表示する", () => {
  const packageInfo = createPackageInfo();
  packageInfo.images = [{ thumbnail: "image/thumbnail.png" }];

  const html = renderCardHtml(packageInfo);

  assert.match(
    html,
    /<img src="https:\/\/raw\.githubusercontent\.com\/Neosku\/aviutl2-catalog-data\/refs\/heads\/main\/image\/thumbnail\.png"/,
  );
  assert.doesNotMatch(html, /data:image\/svg\+xml/);
});

for (const [name, images] of [
  ["imagesが空", []],
  ["thumbnailが未指定", [{}]],
  ["thumbnailが空文字列", [{ thumbnail: "" }]],
] as const) {
  test(`${name}の場合はカテゴリ別プレースホルダーを表示する`, () => {
    const packageInfo = createPackageInfo();
    packageInfo.images = [...images];

    const html = renderCardHtml(packageInfo);

    assert.doesNotMatch(html, /<svg/);
    assert.match(html, /<img src="data:image\/svg\+xml/);
    assert.match(html, /M15\.39%204\.39/);
  });
}

test("未知の種別には汎用パッケージアイコンを表示する", () => {
  const packageInfo = createPackageInfo();
  packageInfo.type = "未知の種別";

  const html = renderCardHtml(packageInfo);

  assert.match(html, /M11%2021\.73/);
});
