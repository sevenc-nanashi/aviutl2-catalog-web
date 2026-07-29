import { render } from "vike/abort";
import { fetchCatalog } from "../../server/catalog";

export type Data = Awaited<ReturnType<typeof data>>;

export async function data() {
  try {
    return {
      packages: await fetchCatalog(),
    };
  } catch (error) {
    console.error("[catalog] Failed to load package list", error);
    throw render(503, "パッケージ一覧を取得できませんでした。");
  }
}
