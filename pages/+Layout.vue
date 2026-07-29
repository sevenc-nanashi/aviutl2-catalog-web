<!-- https://vike.dev/Layout -->

<template>
  <header class="site-header">
    <a href="/" class="ui-focus-ring">{{ t("common.appName") }}</a>
    <div class="header-actions">
      <nav :aria-label="t('common.navigation.main')">
        <a href="/" class="ui-focus-ring">{{ t("common.navigation.packages") }}</a>
        <a href="/badge" class="ui-focus-ring">{{ t("common.navigation.badge") }}</a>
      </nav>
      <label class="locale-selector">
        <span class="sr-only">{{ t("common.language.label") }}</span>
        <span aria-hidden="true" class="i-lucide-languages" />
        <select :aria-label="t('common.language.label')" :value="locale" @change="changeLocale">
          <option value="ja">{{ t("common.language.ja") }}</option>
          <option value="en">{{ t("common.language.en") }}</option>
        </select>
      </label>
    </div>
  </header>
  <div un-p="4">
    <slot />
  </div>
  <div un-flex-grow />
  <footer class="site-footer">
    <a
      href="https://github.com/sevenc-nanashi/aviutl2-catalog-badge"
      target="_blank"
      rel="noopener noreferrer"
      class="link"
      >AviUtl2 Catalog Web</a
    >
    &copy; 2026
    <a
      href="https://sevenc7c.com"
      target="_blank"
      rel="noopener noreferrer"
      class="link"
      un-text="![#48b0d5]"
      >Nanashi.</a
    >
    / {{ t("common.footer.unofficial") }}
  </footer>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import * as v from "valibot";
import { localeCookie, supportedLocaleSchema } from "../lib/i18n/index.ts";
import "@unocss/reset/tailwind-v4.css";
import "@fontsource/noto-sans-jp/400.css";
import "@fontsource/noto-sans-jp/700.css";
import "virtual:uno.css";
import "./design-system.css";
import "./style.css";

const { locale, t } = useI18n({ useScope: "global" });

function changeLocale(event: Event): void {
  if (!(event.target instanceof HTMLSelectElement)) {
    throw new Error("Locale selector target is not a select element");
  }
  const nextLocale = v.parse(supportedLocaleSchema, event.target.value);
  document.cookie = localeCookie(nextLocale, window.location.protocol === "https:");
  window.location.reload();
}
</script>
