import icon from "./icon.svg?raw";
import vike from "@vikejs/hono";
import { Hono } from "hono";
import { showRoutes } from "hono/dev";
import z from "zod";

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

const app = new Hono();

// https://raw.githubusercontent.com/Neosku/aviutl2-catalog-data/refs/heads/main/index.json
const minimumCatalogSchema = z
  .object({
    id: z.string(),
    "latest-version": z.string(),
  })
  .array();

app.get("/api/badge/:name", async (c) => {
  const { name } = c.req.param();
  const data = await fetch(
    `https://raw.githubusercontent.com/Neosku/aviutl2-catalog-data/refs/heads/main/index.json`,
    {
      cf: {
        cacheTtl: 60 * 60, // 1 hour
      },
    },
  )
    .then((res) => res.json())
    .then((data) => minimumCatalogSchema.parse(data));
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
vike(app);
showRoutes(app);

export default {
  port,
  fetch: app.fetch,
};
