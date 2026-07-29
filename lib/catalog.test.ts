import assert from "node:assert/strict";
import test from "node:test";
import {
  collectHeroImage,
  findPackage,
  latestReleaseDate,
  packageInfoSchema,
  toRawGithubProxyUrl,
  type PackageInfo,
} from "./catalog.ts";
import { shouldShowDirectDownload } from "./packageDownload.ts";

function createPackageInfo(): PackageInfo {
  return packageInfoSchema.parse({
    id: "example.package",
    name: "Example Package",
    type: "プラグイン",
    summary: "概要",
    description: "説明",
    author: "Author",
    repoURL: "https://github.com/example/package",
    "latest-version": "2.0.0",
    licenses: [],
    tags: [],
    dependencies: [],
    images: [],
    installer: {
      source: {
        direct: "https://example.com/package.zip",
      },
      install: [],
      uninstall: [],
    },
    version: [
      {
        version: "2.0.0",
        release_date: "2026-02-01",
        file: [],
      },
      {
        version: "1.0.0",
        release_date: "2025-01-01",
        file: [],
      },
    ],
  });
}

test("findPackageはパッケージIDの大文字小文字を区別しない", () => {
  const packageInfo = createPackageInfo();
  assert.equal(findPackage([packageInfo], "EXAMPLE.PACKAGE"), packageInfo);
});

test("raw.githubusercontent.comだけ同一オリジンへ書き換える", () => {
  assert.equal(
    toRawGithubProxyUrl(new URL("https://raw.githubusercontent.com/owner/repo/main/image.png")),
    "/api/raw/owner/repo/main/image.png",
  );
  assert.equal(
    toRawGithubProxyUrl(new URL("https://example.com/image.png")),
    "https://example.com/image.png",
  );
});

test("更新日はversion配列の最大日付を使用する", () => {
  assert.equal(latestReleaseDate(createPackageInfo()), "2026-02-01");
});

test("ヒーロー画像は最初のサムネイルを同一オリジンへ書き換える", () => {
  const packageInfo = createPackageInfo();
  packageInfo.images = [
    {
      thumbnail:
        "https://raw.githubusercontent.com/Neosku/aviutl2-catalog-data/main/image/example.png",
    },
  ];
  assert.equal(
    collectHeroImage(packageInfo),
    "/api/raw/Neosku/aviutl2-catalog-data/main/image/example.png",
  );
});

test("ヒーロー画像はサムネイルより詳細画像を優先する", () => {
  const packageInfo = createPackageInfo();
  packageInfo.images = [
    {
      thumbnail: "image/thumbnail.png",
      infoImg: ["image/detail.png"],
    },
  ];
  assert.equal(
    collectHeroImage(packageInfo),
    "/api/raw/Neosku/aviutl2-catalog-data/refs/heads/main/image/detail.png",
  );
});

test("直接ダウンロード可能なパッケージはダウンロード先を返す", () => {
  assert.equal(
    shouldShowDirectDownload(createPackageInfo()),
    "/api/package/example.package/download",
  );
});

test("BOOTHから取得するパッケージは直接ダウンロード先を返さない", () => {
  const packageInfo = createPackageInfo();
  packageInfo.installer.source = { booth: "https://example.booth.pm/items/123456" };
  assert.equal(shouldShowDirectDownload(packageInfo), null);
});
