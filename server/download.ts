import { z } from "zod";
import type { InstallerSource, PackageInfo } from "../lib/catalog";

const httpsUrlSchema = z
  .url()
  .refine((url) => new URL(url).protocol === "https:", "Download URL must use HTTPS");

const githubAssetSchema = z.object({
  name: z.string(),
  browser_download_url: httpsUrlSchema,
});

const githubReleaseSchema = z.object({
  assets: z.array(githubAssetSchema),
  published_at: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
});

const githubReleasesSchema = z.array(githubReleaseSchema);

type Fetcher = typeof fetch;

function githubHeaders(): HeadersInit {
  return {
    Accept: "application/vnd.github+json",
    "User-Agent": "aviutl2-catalog-web",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

async function fetchGithubRelease(
  source: Extract<InstallerSource, { github: unknown }>["github"],
  fetcher: Fetcher,
): Promise<z.infer<typeof githubReleaseSchema>> {
  const repositoryApi = `https://api.github.com/repos/${encodeURIComponent(source.owner)}/${encodeURIComponent(source.repo)}/releases`;
  const latestResponse = await fetcher(`${repositoryApi}/latest`, {
    headers: githubHeaders(),
    cf: {
      cacheEverything: true,
      cacheTtl: 60 * 60,
    },
  });
  if (latestResponse.ok) {
    return githubReleaseSchema.parse(await latestResponse.json());
  }
  if (latestResponse.status !== 404) {
    throw new Error(`GitHub latest release request failed: HTTP ${latestResponse.status}`);
  }

  const releasesResponse = await fetcher(`${repositoryApi}?per_page=30`, {
    headers: githubHeaders(),
    cf: {
      cacheEverything: true,
      cacheTtl: 60 * 60,
    },
  });
  if (!releasesResponse.ok) {
    throw new Error(`GitHub releases request failed: HTTP ${releasesResponse.status}`);
  }
  const releases = githubReleasesSchema.parse(await releasesResponse.json());
  if (releases.length === 0) {
    throw new Error(`GitHub release is undefined`);
  }
  return releases.reduce((latest, candidate) => {
    const latestDate = Date.parse(latest.published_at ?? latest.created_at ?? "");
    const candidateDate = Date.parse(candidate.published_at ?? candidate.created_at ?? "");
    return candidateDate > latestDate ? candidate : latest;
  });
}

async function resolveGithubDownloadUrl(
  source: Extract<InstallerSource, { github: unknown }>["github"],
  fetcher: Fetcher,
): Promise<string> {
  const release = await fetchGithubRelease(source, fetcher);
  const assetPattern = new RegExp(source.pattern);
  const asset = release.assets.find((candidate) => {
    assetPattern.lastIndex = 0;
    return assetPattern.test(candidate.name);
  });
  if (asset === undefined) {
    throw new Error(`GitHub release asset does not match pattern: ${source.pattern}`);
  }
  return asset.browser_download_url;
}

export async function resolvePackageDownloadUrl(
  packageInfo: PackageInfo,
  fetcher: Fetcher = fetch,
): Promise<string> {
  const source = packageInfo.installer.source;
  if ("direct" in source) {
    return httpsUrlSchema.parse(source.direct);
  }
  if ("booth" in source) {
    return httpsUrlSchema.parse(source.booth);
  }
  if ("GoogleDrive" in source) {
    const url = new URL("https://drive.google.com/uc");
    url.searchParams.set("export", "download");
    url.searchParams.set("id", source.GoogleDrive.id);
    return url.toString();
  }
  return resolveGithubDownloadUrl(source.github, fetcher);
}
