import { render } from "vike/abort";
import type { PageContextServer } from "vike/types";
import { translate } from "../../lib/i18n/index.ts";
import { fetchCatalog } from "../../server/catalog";

export type Data = Awaited<ReturnType<typeof data>>;

export async function data(pageContext: PageContextServer) {
  try {
    return {
      packages: await fetchCatalog(),
    };
  } catch (error) {
    console.error("[catalog] Failed to load package list", error);
    throw render(503, translate(pageContext.locale, "home.errors.loadFailed"));
  }
}
