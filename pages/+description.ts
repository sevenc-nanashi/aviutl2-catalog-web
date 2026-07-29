import type { PageContextServer } from "vike/types";

export default (pageContext: PageContextServer) =>
  pageContext.locale === "ja"
    ? "AviUtl2 Catalogの非公式Webビューワー"
    : "An unofficial web viewer for AviUtl2 Catalog";
