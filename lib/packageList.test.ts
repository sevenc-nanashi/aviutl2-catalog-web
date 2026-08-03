import assert from "node:assert/strict";
import test from "node:test";
import * as v from "valibot";
import { packageInfoSchema, type PackageInfo } from "./catalog.ts";
import {
  filterAndSortPackages,
  packageCategory,
  packageListFilterUrl,
  packageListHistoryStateSchema,
  parsePackageListFilterQuery,
  type PackageListItem,
} from "./packageList.ts";

function createPackage(overrides: Partial<PackageInfo> = {}): PackageInfo {
  return v.parse(packageInfoSchema, {
    id: "example",
    name: "Example",
    type: "汎用プラグイン",
    summary: "便利なツール",
    description: "",
    author: "Nanashi",
    repoURL: "https://example.com",
    "latest-version": "1.0.0",
    licenses: [],
    tags: ["便利"],
    dependencies: [],
    images: [],
    installer: { source: { direct: "https://example.com/a.zip" }, install: [], uninstall: [] },
    version: [{ version: "1.0.0", release_date: "2026-01-01", file: [] }],
    ...overrides,
  });
}

const defaultState = {
  searchQuery: "",
  selectedCategory: "all" as const,
  selectedTags: [],
  deprecationFilter: "all" as const,
  sortOrder: "popularity_desc" as const,
};

test("種類ラベルを一覧カテゴリへ変換する", () => {
  assert.equal(packageCategory(createPackage()), "general-plugin");
  assert.equal(packageCategory(createPackage({ type: "独自形式" })), "other");
});

test("検索は複数語のAND、タグはORで絞り込む", () => {
  const items: PackageListItem[] = [
    { packageInfo: createPackage(), catalogIndex: 0 },
    {
      packageInfo: createPackage({
        id: "other",
        name: "Other",
        author: "Someone",
        summary: "別の機能",
        tags: ["映像"],
      }),
      catalogIndex: 1,
    },
  ];
  assert.deepEqual(
    filterAndSortPackages(items, {
      ...defaultState,
      searchQuery: "example nanashi",
      selectedTags: ["映像", "便利"],
    }).map(({ packageInfo }) => packageInfo.id),
    ["example"],
  );
});

test("追加日順は元インデックスが大きい要素を先にする", () => {
  const items: PackageListItem[] = [
    { packageInfo: createPackage({ id: "old" }), catalogIndex: 0 },
    { packageInfo: createPackage({ id: "new" }), catalogIndex: 10 },
  ];
  assert.deepEqual(
    filterAndSortPackages(items, { ...defaultState, sortOrder: "added_desc" }).map(
      ({ packageInfo }) => packageInfo.id,
    ),
    ["new", "old"],
  );
});

test("履歴状態はスキーマで検証する", () => {
  assert.equal(
    v.safeParse(packageListHistoryStateSchema, {
      ...defaultState,
      tagsExpanded: true,
      scrollY: 120,
    }).success,
    true,
  );
  assert.equal(v.safeParse(packageListHistoryStateSchema, { sortOrder: "invalid" }).success, false);
});

test("詳細ページ用フィルターURLを生成し、一覧で復元する", () => {
  const url = packageListFilterUrl({ searchQuery: "テスト 名前", selectedTags: ["映像 効果"] });
  assert.equal(
    url,
    "/?q=%E3%83%86%E3%82%B9%E3%83%88+%E5%90%8D%E5%89%8D&tag=%E6%98%A0%E5%83%8F+%E5%8A%B9%E6%9E%9C",
  );
  assert.deepEqual(parsePackageListFilterQuery(new URL(url, "https://example.com").searchParams), {
    searchQuery: "テスト 名前",
    selectedTags: ["映像 効果"],
  });
  assert.equal(parsePackageListFilterQuery(new URLSearchParams()), undefined);
});
