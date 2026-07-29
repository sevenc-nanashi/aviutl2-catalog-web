import { z } from "zod";

export const RAW_GITHUB_ORIGIN = "https://raw.githubusercontent.com";
export const CATALOG_INDEX_URL = `${RAW_GITHUB_ORIGIN}/Neosku/aviutl2-catalog-data/refs/heads/main/index.json`;
export const CATALOG_BASE_URL = `${RAW_GITHUB_ORIGIN}/Neosku/aviutl2-catalog-data/refs/heads/main/`;

const copyrightSchema = z.object({
  years: z.string(),
  holder: z.string(),
});

const licenseSchema = z.object({
  type: z.string(),
  isCustom: z.boolean(),
  copyrights: z.array(copyrightSchema),
  licenseBody: z.string().nullable(),
});

const githubSourceSchema = z.object({
  owner: z.string(),
  repo: z.string(),
  pattern: z.string(),
});

export const installerSourceSchema = z.union([
  z.object({ direct: z.url() }),
  z.object({ booth: z.url() }),
  z.object({ github: githubSourceSchema }),
  z.object({ GoogleDrive: z.object({ id: z.string().min(1) }) }),
]);

const installerActionSchema = z.looseObject({
  action: z.string(),
});

const installerSchema = z.object({
  source: installerSourceSchema,
  install: z.array(installerActionSchema),
  uninstall: z.array(installerActionSchema),
});

const versionSchema = z.object({
  version: z.string(),
  release_date: z.iso.date(),
  file: z.array(
    z.object({
      path: z.string(),
      XXH3_128: z.string(),
    }),
  ),
});

const imageSchema = z.object({
  thumbnail: z.string().optional(),
  infoImg: z.array(z.string()).optional(),
});

export const packageInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  summary: z.string(),
  description: z.string(),
  author: z.string(),
  originalAuthor: z.string().optional(),
  repoURL: z.string(),
  "latest-version": z.string(),
  popularity: z.number().default(0),
  trend: z.number().default(0),
  licenses: z.array(licenseSchema),
  niconiCommonsId: z.string().nullable().optional(),
  tags: z.array(z.string()),
  dependencies: z.array(z.string()),
  images: z.array(imageSchema),
  installer: installerSchema,
  version: z.array(versionSchema),
  deprecation: z
    .object({
      message: z.string(),
    })
    .optional(),
});

export const catalogSchema = z.array(packageInfoSchema);

export type PackageInfo = z.infer<typeof packageInfoSchema>;
export type InstallerSource = z.infer<typeof installerSourceSchema>;

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
