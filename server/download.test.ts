import assert from "node:assert/strict";
import test from "node:test";
import * as v from "valibot";
import { packageInfoSchema, type InstallerSource, type PackageInfo } from "../lib/catalog.ts";
import { resolvePackageDownloadUrl } from "./download.ts";

function createPackageInfo(source: InstallerSource): PackageInfo {
  return v.parse(packageInfoSchema, {
    id: "example.package",
    name: "Example Package",
    type: "プラグイン",
    summary: "概要",
    description: "説明",
    author: "Author",
    repoURL: "https://github.com/example/package",
    "latest-version": "1.0.0",
    licenses: [],
    tags: [],
    dependencies: [],
    images: [],
    installer: {
      source,
      install: [],
      uninstall: [],
    },
    version: [],
  });
}

test("direct URLを返す", async () => {
  const packageInfo = createPackageInfo({
    direct: "https://example.com/package.zip",
  });
  assert.equal(await resolvePackageDownloadUrl(packageInfo), "https://example.com/package.zip");
});

test("BOOTH URLを返す", async () => {
  const packageInfo = createPackageInfo({
    booth: "https://booth.pm/downloadables/123456",
  });
  assert.equal(
    await resolvePackageDownloadUrl(packageInfo),
    "https://booth.pm/downloadables/123456",
  );
});

test("Google DriveのダウンロードURLを構築する", async () => {
  const packageInfo = createPackageInfo({
    GoogleDrive: { id: "drive-file-id" },
  });
  assert.equal(
    await resolvePackageDownloadUrl(packageInfo),
    "https://drive.google.com/uc?export=download&id=drive-file-id",
  );
});

test("GitHub最新リリースから正規表現に一致するアセットを返す", async () => {
  const packageInfo = createPackageInfo({
    github: {
      owner: "example",
      repo: "package",
      pattern: "\\.zip$",
    },
  });
  const fetcher = (async () =>
    new Response(
      JSON.stringify({
        assets: [
          {
            name: "package.txt",
            browser_download_url:
              "https://github.com/example/package/releases/download/v1/package.txt",
          },
          {
            name: "package.zip",
            browser_download_url:
              "https://github.com/example/package/releases/download/v1/package.zip",
          },
        ],
        published_at: "2026-01-01T00:00:00Z",
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    )) as typeof fetch;

  assert.equal(
    await resolvePackageDownloadUrl(packageInfo, fetcher),
    "https://github.com/example/package/releases/download/v1/package.zip",
  );
});

test("GitHub APIへ環境変数のトークンを送信する", async () => {
  const packageInfo = createPackageInfo({
    github: {
      owner: "example",
      repo: "package",
      pattern: "\\.zip$",
    },
  });
  let authorization: string | null = null;
  const fetcher = (async (_input: string | URL | Request, init?: RequestInit) => {
    authorization = new Headers(init?.headers).get("Authorization");
    return new Response(
      JSON.stringify({
        assets: [
          {
            name: "package.zip",
            browser_download_url:
              "https://github.com/example/package/releases/download/v1/package.zip",
          },
        ],
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  }) as typeof fetch;

  await resolvePackageDownloadUrl(packageInfo, fetcher, "github-token");

  assert.equal(authorization, "Bearer github-token");
});

test("一致するGitHubアセットがない場合は失敗する", async () => {
  const packageInfo = createPackageInfo({
    github: {
      owner: "example",
      repo: "package",
      pattern: "\\.zip$",
    },
  });
  const fetcher = (async () =>
    new Response(
      JSON.stringify({
        assets: [
          {
            name: "package.txt",
            browser_download_url:
              "https://github.com/example/package/releases/download/v1/package.txt",
          },
        ],
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    )) as typeof fetch;

  await assert.rejects(resolvePackageDownloadUrl(packageInfo, fetcher), /does not match pattern/);
});
