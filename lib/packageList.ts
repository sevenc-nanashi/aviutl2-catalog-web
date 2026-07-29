import { z } from "zod";
import {
  latestReleaseDate,
  resolveCatalogUrl,
  toRawGithubProxyUrl,
  type PackageInfo,
} from "./catalog.ts";

export const packageCategories = [
  { key: "all", translationKey: "all" },
  { key: "core", translationKey: "core" },
  { key: "mod", translationKey: "mod" },
  { key: "input-plugin", translationKey: "inputPlugin" },
  { key: "output-plugin", translationKey: "outputPlugin" },
  { key: "general-plugin", translationKey: "generalPlugin" },
  { key: "filter-plugin", translationKey: "filterPlugin" },
  { key: "script", translationKey: "script" },
  { key: "other", translationKey: "other" },
] as const;

const categorySchema = z.enum(packageCategories.map(({ key }) => key));
const deprecationSchema = z.enum(["active", "deprecated", "all"]);
const sortSchema = z.enum(["popularity_desc", "trend_desc", "added_desc", "updated_desc"]);

export type PackageCategory = z.infer<typeof categorySchema>;
export type PackageDeprecationFilter = z.infer<typeof deprecationSchema>;
export type PackageSortOrder = z.infer<typeof sortSchema>;

export function packageCategoryTranslationKey(category: PackageCategory): string {
  const definition = packageCategories.find(({ key }) => key === category);
  if (definition === undefined) {
    throw new Error(`Package category is undefined: ${category}`);
  }
  return definition.translationKey;
}

export interface PackageListItem {
  packageInfo: PackageInfo;
  catalogIndex: number;
}

export const packageListHistoryStateSchema = z.object({
  searchQuery: z.string(),
  selectedCategory: categorySchema,
  selectedTags: z.array(z.string()),
  deprecationFilter: deprecationSchema,
  sortOrder: sortSchema,
  tagsExpanded: z.boolean(),
  scrollY: z.number().nonnegative(),
});

export type PackageListHistoryState = z.infer<typeof packageListHistoryStateSchema>;

const primaryCategoryByType = new Map<string, Exclude<PackageCategory, "all">>([
  ["本体", "core"],
  ["core", "core"],
  ["MOD", "mod"],
  ["mod", "mod"],
  ["入力プラグイン", "input-plugin"],
  ["input-plugin", "input-plugin"],
  ["inputPlugin", "input-plugin"],
  ["出力プラグイン", "output-plugin"],
  ["output-plugin", "output-plugin"],
  ["outputPlugin", "output-plugin"],
  ["汎用プラグイン", "general-plugin"],
  ["general-plugin", "general-plugin"],
  ["generalPlugin", "general-plugin"],
  ["フィルタプラグイン", "filter-plugin"],
  ["filter-plugin", "filter-plugin"],
  ["filterPlugin", "filter-plugin"],
  ["スクリプト", "script"],
  ["script", "script"],
  ["その他", "other"],
  ["other", "other"],
]);

export function packageTypeTranslationKey(packageInfo: PackageInfo): string | undefined {
  const category = primaryCategoryByType.get(packageInfo.type.trim());
  return category === undefined ? undefined : packageCategoryTranslationKey(category);
}

function normalizeSearchText(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("ja-JP");
}

export function packageCategory(packageInfo: PackageInfo): Exclude<PackageCategory, "all"> {
  return primaryCategoryByType.get(packageInfo.type.trim()) ?? "other";
}

export function packageThumbnail(packageInfo: PackageInfo): string | undefined {
  const thumbnail = packageInfo.images
    .map(({ thumbnail: source }) => source)
    .find((source) => source !== undefined && source.length > 0);
  if (thumbnail === undefined) {
    return undefined;
  }
  return toRawGithubProxyUrl(resolveCatalogUrl(thumbnail));
}

export function packageListTags(items: PackageListItem[]): string[] {
  return [...new Set(items.flatMap(({ packageInfo }) => packageInfo.tags))].toSorted((a, b) =>
    a.localeCompare(b, "ja-JP", { sensitivity: "base" }),
  );
}

export function filterAndSortPackages(
  items: PackageListItem[],
  state: Omit<PackageListHistoryState, "tagsExpanded" | "scrollY">,
): PackageListItem[] {
  const searchTerms = normalizeSearchText(state.searchQuery).split(/\s+/).filter(Boolean);
  return items
    .filter(({ packageInfo }) => {
      const searchableValues = [packageInfo.name, packageInfo.author, packageInfo.summary].map(
        normalizeSearchText,
      );
      const matchesSearch = searchTerms.every((term) =>
        searchableValues.some((value) => value.includes(term)),
      );
      const matchesCategory =
        state.selectedCategory === "all" || packageCategory(packageInfo) === state.selectedCategory;
      const matchesTags =
        state.selectedTags.length === 0 ||
        packageInfo.tags.some((tag) => state.selectedTags.includes(tag));
      const matchesDeprecation =
        state.deprecationFilter === "all" ||
        (state.deprecationFilter === "deprecated"
          ? packageInfo.deprecation !== undefined
          : packageInfo.deprecation === undefined);
      return matchesSearch && matchesCategory && matchesTags && matchesDeprecation;
    })
    .toSorted(packageSorter(state.sortOrder));
}

function packageSorter(
  sortOrder: PackageSortOrder,
): (left: PackageListItem, right: PackageListItem) => number {
  const compareByName = (left: PackageListItem, right: PackageListItem) =>
    left.packageInfo.name.localeCompare(right.packageInfo.name, "ja-JP");
  const compareByUpdatedDate = (left: PackageListItem, right: PackageListItem) => {
    const leftDate = latestReleaseDate(left.packageInfo) ?? "";
    const rightDate = latestReleaseDate(right.packageInfo) ?? "";
    return rightDate.localeCompare(leftDate) || compareByName(left, right);
  };

  if (sortOrder === "added_desc") {
    return (left, right) => right.catalogIndex - left.catalogIndex || compareByName(left, right);
  }
  if (sortOrder === "updated_desc") {
    return compareByUpdatedDate;
  }
  if (sortOrder === "trend_desc") {
    return (left, right) =>
      right.packageInfo.trend - left.packageInfo.trend || compareByUpdatedDate(left, right);
  }
  return (left, right) =>
    right.packageInfo.popularity - left.packageInfo.popularity || compareByUpdatedDate(left, right);
}
