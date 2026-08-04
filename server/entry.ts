/// <reference types="../worker-configuration.d.ts" />
import icon from "./icon.svg?raw";
import vike from "@vikejs/hono";
import { Hono } from "hono";
import { showRoutes } from "hono/dev";
import * as v from "valibot";
import { sValidator } from "@hono/standard-validator";
import { resolveLocale, translate } from "../lib/i18n/index.ts";
import { fetchCatalog, fetchPackageInfo } from "./catalog";
import { resolvePackageDownloadUrl } from "./download";
import { renderCardHtml, renderCardImage, renderCardSvg } from "./card.ts";
import { packageInfoEtag } from "./cardCache.ts";

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

type Bindings = {
  GITHUB_TOKEN?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

const rawGithubPathSchema = v.pipe(v.string(), v.minLength(1));
const imageExtensionPattern = /\.(?:avif|gif|jpe?g|png|webp)$/i;
const rawGithubRoutePrefix = "/api/raw/";

app.get("/api/badge/:name", async (c) => {
  const { name } = c.req.param();
  const data = await fetchCatalog();
  const packageData = data.find(
    (pkg) => pkg.id.toLowerCase() === name.toLowerCase(),
  );
  if (!packageData) {
    return c.json({
      schemaVersion: 1,
      label: "Catalog",
      message: "not found",
      color: "red",
    });
  }

  return c.json({
    schemaVersion: 1,
    logoSvg: icon,
    label: "Catalog",
    message: packageData["latest-version"],
    color: "#65CDD2",
  });
});

app.get("/api/package/:id", async (c) => {
  const locale = resolveLocale(c.req.raw.headers);
  const packageInfo = await fetchPackageInfo(c.req.param("id"));
  if (packageInfo === undefined) {
    return c.json(
      { error: translate(locale, "package.errors.downloadNotFound") },
      404,
    );
  }
  c.header("Cache-Control", "public, max-age=3600");
  return c.json(packageInfo);
});

app.get("/api/package/:id/download", async (c) => {
  const locale = resolveLocale(c.req.raw.headers);
  const packageInfo = await fetchPackageInfo(c.req.param("id"));
  if (packageInfo === undefined) {
    return c.text(translate(locale, "package.errors.downloadNotFound"), 404);
  }
  if ("booth" in packageInfo.installer.source) {
    return c.text(
      translate(locale, "package.errors.directDownloadUnavailable"),
      404,
    );
  }
  try {
    return c.redirect(
      await resolvePackageDownloadUrl(packageInfo, fetch, c.env.GITHUB_TOKEN),
      302,
    );
  } catch (error) {
    console.error(
      `[package:${packageInfo.id}] Failed to resolve download URL`,
      error,
    );
    return c.text(translate(locale, "package.errors.downloadFailed"), 502);
  }
});

app.get("/api/raw/*", async (c) => {
  const requestUrl = new URL(c.req.url);
  const rawPath = v.parse(
    rawGithubPathSchema,
    requestUrl.pathname.slice(rawGithubRoutePrefix.length),
  );
  const upstreamUrl = new URL("https://raw.githubusercontent.com/");
  upstreamUrl.pathname = `/${rawPath.replace(/^\/+/, "")}`;
  upstreamUrl.search = requestUrl.search;
  const cacheTtl = imageExtensionPattern.test(upstreamUrl.pathname)
    ? 60 * 60 * 24
    : 60 * 60;
  const upstreamResponse = await fetch(upstreamUrl, {
    cf: {
      cacheEverything: true,
      cacheTtl,
    },
  });
  const response = new Response(upstreamResponse.body, upstreamResponse);
  response.headers.set("Cache-Control", `public, max-age=${cacheTtl}`);
  response.headers.set("X-Content-Type-Options", "nosniff");
  return response;
});

app.get("/badge/v/:packageName", (c) => {
  const { packageName } = c.req.param();
  const url = new URL(c.req.url);
  const baseUrl =
    // NOTE: shields.ioはhttpsでしか読み込めないので、httpsでアクセスされた場合（=Branch Preview）でのみオリジンを使う
    url.protocol === "https:"
      ? url.origin
      : "https://aviutl2-catalog-badge.sevenc7c.workers.dev";
  const apiUrl = `${baseUrl}/api/badge/${encodeURIComponent(packageName)}`;
  const shieldsUrl = new URL("https://img.shields.io/endpoint");
  shieldsUrl.searchParams.set("url", apiUrl);
  const requestUrl = new URL(c.req.url);
  for (const [key, value] of requestUrl.searchParams) {
    shieldsUrl.searchParams.set(key, value);
  }
  return c.redirect(shieldsUrl.toString());
});

app.get(
  "/api/card/:packageName",
  sValidator(
    "query",
    v.object({
      format: v.picklist(["html", "svg", "image"] as const),
    }),
  ),
  async (c) => {
    const { packageName } = c.req.param();
    const query = c.req.valid("query");
    const packageInfo = await fetchPackageInfo(packageName);
    if (!packageInfo) {
      return c.text("Package not found", 404);
    }
    if (query.format === "html") {
      const html = renderCardHtml(packageInfo);
      return c.html(html);
    }
    if (query.format === "svg") {
      const svg = (await renderCardSvg(packageInfo)) as string;
      return c.html(svg);
    }

    const etag = await packageInfoEtag(packageInfo);
    if (c.req.header("If-None-Match") === etag) {
      return c.body(null, 304);
    }
    const response = await renderCardImage(packageInfo);
    response.headers.set("ETag", etag);
    return response;
  },
);

vike(app);
showRoutes(app);

export default {
  port,
  fetch: app.fetch,
};
