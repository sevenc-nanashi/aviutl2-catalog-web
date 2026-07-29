import { render } from "vike/abort";
import type { PageContextServer } from "vike/types";
import { fetchPackagePageData } from "../../../server/catalog";

export type Data = Awaited<ReturnType<typeof data>>;

export async function data(pageContext: PageContextServer) {
  const packageId = pageContext.routeParams.id;
  let packageData;
  try {
    packageData = await fetchPackagePageData(packageId);
  } catch (error) {
    console.error(`[package:${packageId}] Failed to load package data`, error);
    throw render(503, "パッケージ情報を取得できませんでした。");
  }
  if (packageData === undefined) {
    throw render(404, `パッケージ「${packageId}」は登録されていません。`);
  }
  return packageData;
}
