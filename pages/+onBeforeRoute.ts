import type { PageContext } from "vike/types";
import { resolveLocale } from "../lib/i18n/index.ts";

export function onBeforeRoute(pageContext: PageContext) {
  if (pageContext.isClientSide) {
    return;
  }
  return {
    pageContext: {
      locale: resolveLocale(pageContext.headers),
    },
  };
}
