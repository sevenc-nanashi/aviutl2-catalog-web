import type { PageContext } from "vike/types";
import { resolveLocale } from "../lib/i18n/index.ts";

export function onBeforeRoute(pageContext: PageContext) {
  const headers = pageContext.isClientSide
    ? {
        cookie: document.cookie,
        "accept-language": navigator.languages.join(","),
      }
    : pageContext.headers;

  return {
    pageContext: {
      locale: resolveLocale(headers),
    },
  };
}
