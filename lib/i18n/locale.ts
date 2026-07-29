import { z } from "zod";

export const supportedLocaleSchema = z.enum(["ja", "en"]);
export type SupportedLocale = z.infer<typeof supportedLocaleSchema>;

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
  const parsed = z.string().trim().toLowerCase().safeParse(value);
  if (!parsed.success) {
    return "ja";
  }
  const language = parsed.data.split("-")[0];
  return supportedLocaleSchema.safeParse(language).data ?? "ja";
}

export function resolveLocale(
  headers: Headers | Record<string, string> | null | undefined,
): SupportedLocale {
  const cookieLocale = supportedLocaleSchema.safeParse(
    cookieValue(headerValue(headers, "cookie"), localeCookieName),
  );
  if (cookieLocale.success) {
    return cookieLocale.data;
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
    const parsed = supportedLocaleSchema.safeParse(normalized);
    if (parsed.success) {
      return parsed.data;
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
