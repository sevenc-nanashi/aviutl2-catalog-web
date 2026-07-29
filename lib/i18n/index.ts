import { createI18n } from "vue-i18n";
import { messages } from "./messages.ts";
import type { SupportedLocale } from "./locale.ts";

export function createAppI18n(locale: SupportedLocale) {
  return createI18n({
    legacy: false,
    locale,
    fallbackLocale: "ja",
    messages,
  });
}

function valueAtPath(locale: SupportedLocale, key: string): unknown {
  let value: unknown = messages[locale];
  for (const segment of key.split(".")) {
    if (typeof value !== "object" || value === null || !(segment in value)) {
      throw new Error(`Translation key is undefined: ${locale}.${key}`);
    }
    value = (value as Record<string, unknown>)[segment];
  }
  return value;
}

export function translate(
  locale: SupportedLocale,
  key: string,
  parameters: Record<string, string | number> = {},
): string {
  const value = valueAtPath(locale, key);
  if (typeof value !== "string") {
    throw new Error(`Translation value is not a string: ${locale}.${key}`);
  }
  return value.replace(/\{(?<name>[^{}]+)\}/g, (_placeholder, _name, _offset, _source, groups) => {
    const name = (groups as { name: string }).name;
    if (!(name in parameters)) {
      throw new Error(`Translation parameter is undefined: ${locale}.${key}.${name}`);
    }
    return String(parameters[name]);
  });
}

export {
  localeCookie,
  localeCookieName,
  normalizeLocale,
  resolveLocale,
  supportedLocaleSchema,
} from "./locale.ts";
export type { SupportedLocale } from "./locale.ts";
