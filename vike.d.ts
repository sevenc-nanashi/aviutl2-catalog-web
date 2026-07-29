import type { SupportedLocale } from "./lib/i18n/index.ts";

declare global {
  namespace Vike {
    interface PageContext {
      locale: SupportedLocale;
    }
  }
}

export {};
