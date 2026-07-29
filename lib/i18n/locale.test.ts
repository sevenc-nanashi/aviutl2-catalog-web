import assert from "node:assert/strict";
import test from "node:test";
import { translate } from "./index.ts";
import { messages } from "./messages.ts";
import { localeCookie, normalizeLocale, resolveLocale } from "./locale.ts";

function translationKeys(value: object, prefix = ""): string[] {
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix.length === 0 ? key : `${prefix}.${key}`;
    if (typeof child === "object" && child !== null) {
      return translationKeys(child, path);
    }
    return [path];
  });
}

test("locale CookieをAccept-Languageより優先する", () => {
  assert.equal(
    resolveLocale({
      cookie: "other=value; aviutl2-catalog-locale=ja",
      "accept-language": "en-US,en;q=0.9",
    }),
    "ja",
  );
});

test("英語の地域localeをenへ正規化する", () => {
  assert.equal(normalizeLocale("en-US"), "en");
  assert.equal(resolveLocale({ "accept-language": "en-GB,en;q=0.8" }), "en");
});

test("未対応または不正なlocaleはjaにする", () => {
  assert.equal(normalizeLocale("fr-FR"), "ja");
  assert.equal(resolveLocale({ cookie: "aviutl2-catalog-locale=fr" }), "ja");
});

test("locale Cookieへ必要な属性を付ける", () => {
  assert.equal(
    localeCookie("en", true),
    "aviutl2-catalog-locale=en; Path=/; Max-Age=31536000; SameSite=Lax; Secure",
  );
});

test("日本語と英語の翻訳キーが一致する", () => {
  assert.deepEqual(translationKeys(messages.ja), translationKeys(messages.en));
});

test("翻訳パラメーターを展開する", () => {
  assert.equal(
    translate("en", "home.card.openDetails", { name: "Example" }),
    "Open details for Example",
  );
});
