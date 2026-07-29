import type { PageContext } from "vike/types";
import { createAppI18n } from "../lib/i18n/index.ts";

export function onCreateApp(pageContext: PageContext): void {
  if (pageContext.isRenderingHead) {
    return;
  }
  const app = pageContext.app;
  if (app === undefined) {
    throw new Error("Vue app is undefined");
  }
  app.use(createAppI18n(pageContext.locale));
}
