import * as v from "valibot";

export const supportedLocaleSchema = v.picklist(["ja", "en"]);
export type SupportedLocale = v.InferOutput<typeof supportedLocaleSchema>;

export const localeCookieName = "aviutl2-catalog-locale";

function headerValue(
  headers: Headers | Record<string, string> | null | undefined,
  name: string,
): string | undefined {
  if (headers === null || headers === undefined) {
    return undefined;
  }
  if (headers instanceof Headers) {
    return headers.get(name) ?? undefined;
  }
  return headers[name.toLowerCase()] ?? headers[name];
}

function cookieValue(cookieHeader: string | undefined, name: string): string | undefined {
  if (cookieHeader === undefined) {
    return undefined;
  }
  for (const cookie of cookieHeader.split(";")) {
    const separatorIndex = cookie.indexOf("=");
    if (separatorIndex < 0) {
      continue;
    }
    if (cookie.slice(0, separatorIndex).trim() === name) {
      return decodeURIComponent(cookie.slice(separatorIndex + 1).trim());
    }
  }
  return undefined;
}

export function normalizeLocale(value: unknown): SupportedLocale {
  const parsed = v.safeParse(v.pipe(v.string(), v.trim(), v.toLowerCase()), value);
  if (!parsed.success) {
    return "ja";
  }
  const language = parsed.output.split("-")[0];
  const locale = v.safeParse(supportedLocaleSchema, language);
  return locale.success ? locale.output : "ja";
}

export function resolveLocale(
  headers: Headers | Record<string, string> | null | undefined,
): SupportedLocale {
  const cookieLocale = v.safeParse(
    supportedLocaleSchema,
    cookieValue(headerValue(headers, "cookie"), localeCookieName),
  );
  if (cookieLocale.success) {
    return cookieLocale.output;
  }

  const acceptLanguage = headerValue(headers, "accept-language");
  if (acceptLanguage === undefined) {
    return "ja";
  }
  const preferredLanguages = acceptLanguage
    .split(",")
    .map((entry) => {
      const [language, ...parameters] = entry.trim().split(";");
      const qualityParameter = parameters.find((parameter) => parameter.trim().startsWith("q="));
      const quality = qualityParameter === undefined ? 1 : Number(qualityParameter.trim().slice(2));
      return { language, quality: Number.isFinite(quality) ? quality : 0 };
    })
    .toSorted((left, right) => right.quality - left.quality);

  for (const { language } of preferredLanguages) {
    const normalized = language.trim().toLowerCase().split("-")[0];
    const parsed = v.safeParse(supportedLocaleSchema, normalized);
    if (parsed.success) {
      return parsed.output;
    }
  }
  return "ja";
}

export function localeCookie(locale: SupportedLocale, secure: boolean): string {
  const attributes = [
    `${localeCookieName}=${locale}`,
    "Path=/",
    "Max-Age=31536000",
    "SameSite=Lax",
  ];
  if (secure) {
    attributes.push("Secure");
  }
  return attributes.join("; ");
}
