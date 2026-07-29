import * as v from "valibot";

export const RAW_GITHUB_ORIGIN = "https://raw.githubusercontent.com";
export const CATALOG_INDEX_URL = `${RAW_GITHUB_ORIGIN}/Neosku/aviutl2-catalog-data/refs/heads/main/index.json`;
export const CATALOG_BASE_URL = `${RAW_GITHUB_ORIGIN}/Neosku/aviutl2-catalog-data/refs/heads/main/`;

const copyrightSchema = v.object({
  years: v.string(),
  holder: v.string(),
});

const licenseSchema = v.object({
  type: v.string(),
  isCustom: v.boolean(),
  copyrights: v.array(copyrightSchema),
  licenseBody: v.nullable(v.string()),
});

const githubSourceSchema = v.object({
  owner: v.string(),
  repo: v.string(),
  pattern: v.string(),
});

export const installerSourceSchema = v.union([
  v.object({ direct: v.pipe(v.string(), v.url()) }),
  v.object({ booth: v.pipe(v.string(), v.url()) }),
  v.object({ github: githubSourceSchema }),
  v.object({ GoogleDrive: v.object({ id: v.pipe(v.string(), v.minLength(1)) }) }),
]);

const installerActionSchema = v.variant("action", [
  v.object({
    action: v.literal("download"),
  }),

  v.object({
    action: v.literal("extract"),
    from: v.optional(v.string()),
    to: v.optional(v.string()),
  }),

  v.object({
    action: v.literal("extract_sfx"),
    from: v.optional(v.string()),
    to: v.optional(v.string()),
  }),

  v.object({
    action: v.literal("copy"),
    from: v.string(),
    to: v.string(),
  }),

  v.object({
    action: v.literal("delete"),
    path: v.string(),
  }),

  v.object({
    action: v.literal("run"),
    path: v.string(),
    args: v.array(v.string()),
    elevate: v.optional(v.boolean()),
  }),

  v.object({
    action: v.literal("run_auo_setup"),
    path: v.string(),
  }),
]);

const installerSchema = v.object({
  source: installerSourceSchema,
  install: v.array(installerActionSchema),
  uninstall: v.array(installerActionSchema),
});

const versionSchema = v.object({
  version: v.string(),
  release_date: v.pipe(v.string(), v.isoDate()),
  file: v.array(
    v.object({
      path: v.string(),
      XXH3_128: v.string(),
    }),
  ),
});

const imageSchema = v.object({
  thumbnail: v.optional(v.string()),
  infoImg: v.optional(v.array(v.string())),
});

export const packageInfoSchema = v.object({
  id: v.string(),
  name: v.string(),
  type: v.string(),
  summary: v.string(),
  description: v.string(),
  author: v.string(),
  originalAuthor: v.optional(v.string()),
  repoURL: v.string(),
  "latest-version": v.string(),
  popularity: v.optional(v.number(), 0),
  trend: v.optional(v.number(), 0),
  licenses: v.array(licenseSchema),
  niconiCommonsId: v.optional(v.nullable(v.string())),
  tags: v.array(v.string()),
  dependencies: v.array(v.string()),
  images: v.array(imageSchema),
  installer: installerSchema,
  version: v.array(versionSchema),
  deprecation: v.optional(
    v.object({
      message: v.string(),
    }),
  ),
});

export const catalogSchema = v.array(packageInfoSchema);

export type PackageInfo = v.InferOutput<typeof packageInfoSchema>;
export type InstallerSource = v.InferOutput<typeof installerSourceSchema>;

export interface PackagePageData {
  packageInfo: PackageInfo;
  descriptionHtml: string;
  heroImage?: string;
  screenshots: string[];
}

export function findPackage(catalog: PackageInfo[], packageId: string): PackageInfo | undefined {
  const normalizedId = packageId.toLowerCase();
  return catalog.find((item) => item.id.toLowerCase() === normalizedId);
}

export function resolveCatalogUrl(pathOrUrl: string): URL {
  return new URL(pathOrUrl, CATALOG_BASE_URL);
}

export function toRawGithubProxyUrl(url: URL): string {
  if (url.origin !== RAW_GITHUB_ORIGIN) {
    return url.toString();
  }
  return `/api/raw${url.pathname}${url.search}`;
}

export function collectScreenshots(packageInfo: PackageInfo): string[] {
  return packageInfo.images.flatMap((group) =>
    (group.infoImg ?? [])
      .filter((src) => src.length > 0)
      .map((src) => toRawGithubProxyUrl(resolveCatalogUrl(src))),
  );
}

export function collectHeroImage(packageInfo: PackageInfo): string | undefined {
  const detailImage = packageInfo.images
    .flatMap((group) => group.infoImg ?? [])
    .find((source) => source.length > 0);
  if (detailImage !== undefined) {
    return toRawGithubProxyUrl(resolveCatalogUrl(detailImage));
  }
  const thumbnail = packageInfo.images
    .map((group) => group.thumbnail)
    .find((source) => source !== undefined && source.length > 0);
  if (thumbnail === undefined) {
    return undefined;
  }
  return toRawGithubProxyUrl(resolveCatalogUrl(thumbnail));
}

export function latestReleaseDate(packageInfo: PackageInfo): string | undefined {
  return packageInfo.version
    .map((version) => version.release_date)
    .sort()
    .at(-1);
}
