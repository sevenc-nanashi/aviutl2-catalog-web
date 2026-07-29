import {
  CATALOG_INDEX_URL,
  catalogSchema,
  collectHeroImage,
  collectScreenshots,
  findPackage,
  type PackageInfo,
  type PackagePageData,
  resolveCatalogUrl,
} from "../lib/catalog";
import * as v from "valibot";
import type { SupportedLocale } from "../lib/i18n/index.ts";
import { renderPackageMarkdown } from "./markdown";

const CATALOG_CACHE_SECONDS = 60 * 60;

export async function fetchCatalog(): Promise<PackageInfo[]> {
  const response = await fetch(CATALOG_INDEX_URL, {
    cf: {
      cacheEverything: true,
      cacheTtl: CATALOG_CACHE_SECONDS,
    },
  });
  if (!response.ok) {
    throw new Error(`Catalog request failed: HTTP ${response.status}`);
  }
  return v.parse(catalogSchema, await response.json());
}

export async function fetchPackageInfo(packageId: string): Promise<PackageInfo | undefined> {
  return findPackage(await fetchCatalog(), packageId);
}

function isMarkdownSource(description: string): boolean {
  return (
    description.startsWith("https://") ||
    /\.(?:md|markdown|mdown|mkd|txt)(?:\?.*)?$/i.test(description)
  );
}

async function loadDescription(
  packageInfo: PackageInfo,
): Promise<{ markdownSource: string; baseUrl: string }> {
  if (!isMarkdownSource(packageInfo.description)) {
    return {
      markdownSource: packageInfo.description,
      baseUrl: packageInfo.repoURL,
    };
  }

  const descriptionUrl = resolveCatalogUrl(packageInfo.description);
  const response = await fetch(descriptionUrl, {
    cf: {
      cacheEverything: true,
      cacheTtl: CATALOG_CACHE_SECONDS,
    },
  });
  if (!response.ok) {
    throw new Error(`Description request failed: HTTP ${response.status}`);
  }
  return {
    markdownSource: await response.text(),
    baseUrl: descriptionUrl.toString(),
  };
}

export async function fetchPackagePageData(
  packageId: string,
  locale: SupportedLocale,
): Promise<PackagePageData | undefined> {
  const packageInfo = await fetchPackageInfo(packageId);
  if (packageInfo === undefined) {
    return undefined;
  }

  const description = await loadDescription(packageInfo);
  return {
    packageInfo,
    descriptionHtml: renderPackageMarkdown(description.markdownSource, description.baseUrl, locale),
    heroImage: collectHeroImage(packageInfo),
    screenshots: collectScreenshots(packageInfo),
  };
}
