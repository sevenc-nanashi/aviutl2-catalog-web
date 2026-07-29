import { render } from "vike/abort";
import type { PageContextServer } from "vike/types";
import { translate } from "../../../lib/i18n/index.ts";
import { fetchPackagePageData } from "../../../server/catalog";

export type Data = Awaited<ReturnType<typeof data>>;

export async function data(pageContext: PageContextServer) {
  const packageId = pageContext.routeParams.id;
  let packageData;
  try {
    packageData = await fetchPackagePageData(packageId, pageContext.locale);
  } catch (error) {
    console.error(`[package:${packageId}] Failed to load package data`, error);
    throw render(503, translate(pageContext.locale, "package.errors.loadFailed"));
  }
  if (packageData === undefined) {
    throw render(404, translate(pageContext.locale, "package.errors.notFound", { id: packageId }));
  }
  return packageData;
}
