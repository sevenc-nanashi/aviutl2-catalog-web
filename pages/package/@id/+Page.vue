<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useData } from "vike-vue/useData";
import PackageContent from "./PackageContent.vue";
import PackageHero from "./PackageHero.vue";
import PackageSidebar from "./PackageSidebar.vue";
import type { Data } from "./+data";

const data = useData<Data>();
const { t } = useI18n({ useScope: "global" });
const packageInfo = computed(() => data.packageInfo);
</script>

<template>
  <main class="package-page">
    <nav :aria-label="t('package.breadcrumb.label')" class="breadcrumb">
      <a href="/" class="ui-focus-ring">{{ t("package.breadcrumb.home") }}</a>
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="m9 18 6-6-6-6" />
      </svg>
      <span aria-current="page">{{ packageInfo.name }}</span>
    </nav>

    <PackageHero :package-info="packageInfo" :hero-image="data.heroImage" />

    <div class="package-layout">
      <PackageContent
        :package-info="packageInfo"
        :description-html="data.descriptionHtml"
        :screenshots="data.screenshots"
      />
      <PackageSidebar :package-info="packageInfo" />
    </div>
  </main>
</template>

<style>
.package-page {
  --space-xs: var(--ui-space-1);
  --space-sm: var(--ui-space-2);
  --space-md: var(--ui-space-3);
  --space-lg: var(--ui-space-4);
  --space-xl: var(--ui-space-6);
  --space-2xl: var(--ui-space-8);
  --space-3xl: var(--ui-space-12);
  width: min(100%, 72rem);
  margin-inline: auto;
  display: grid;
  gap: var(--space-xl);
}

.breadcrumb {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  color: var(--ui-text-subtle);
  font-size: var(--ui-text-sm);
}

.breadcrumb svg {
  width: 1rem;
  height: 1rem;
  margin-inline: var(--space-sm);
  flex: none;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

.breadcrumb a {
  display: inline-flex;
  align-items: center;
  transition: color 150ms ease-out;
}

.breadcrumb a:hover {
  color: light-dark(theme("colors.slate.900"), theme("colors.slate.100"));
}

.breadcrumb span:last-child {
  overflow: hidden;
  color: var(--ui-text);
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.package-hero {
  position: relative;
  padding: var(--space-xl);
  overflow: hidden;
  box-shadow: none;
}

.package-hero.has-image {
  min-height: 10rem;
}

.package-hero.has-image::before {
  position: absolute;
  inset: 0;
  background-image: var(--hero-image);
  background-position: center;
  background-size: cover;
  content: "";
  opacity: 0.25;
}

.package-heading {
  position: relative;
  min-width: 0;
  display: grid;
  gap: var(--space-sm);
}

.package-heading h1 {
  color: var(--ui-text);
  font-size: var(--ui-text-2xl);
  font-weight: 700;
  line-height: 1.4;
}

.package-layout {
  display: grid;
  gap: var(--space-xl);
}

.package-content,
.package-sidebar,
.sidebar-sticky {
  min-width: 0;
  display: grid;
  align-content: start;
  gap: var(--space-xl);
}

.content-section {
  display: grid;
  gap: var(--space-md);
}

.content-section h2 {
  color: var(--ui-text-strong);
  font-size: var(--ui-text-lg);
  font-weight: 700;
  line-height: 1.4;
}

.summary {
  max-width: 70ch;
  color: var(--ui-text-muted);
  font-size: var(--ui-text-base);
  line-height: 1.75;
}

.deprecation {
  margin-top: var(--space-sm);
  display: grid;
  gap: var(--space-sm);
  color: light-dark(theme("colors.amber.800"), theme("colors.amber.200"));
  font-size: var(--ui-text-sm);
  line-height: 1.6;
}

.deprecation h3 {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  color: light-dark(theme("colors.amber.600"), theme("colors.amber.300"));
  font-weight: 700;
}

.deprecation h3 svg {
  width: 1rem;
  height: 1rem;
  flex: none;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

.deprecation blockquote {
  padding: var(--space-md);
  background: light-dark(theme("colors.amber.50"), rgb(120 53 15 / 0.3));
  border: 1px solid light-dark(theme("colors.amber.200"), theme("colors.amber.800"));
  border-radius: var(--ui-radius-lg);
}

.image-carousel {
  position: relative;
  min-width: 0;
}

.screenshot-grid {
  display: flex;
  gap: var(--space-lg);
  overflow-x: auto;
  scroll-behavior: smooth;
  scroll-snap-type: x mandatory;
}

.screenshot-frame {
  width: 100%;
  flex: 0 0 100%;
  max-height: 34rem;
  border: 1px solid var(--ui-border);
  border-radius: var(--ui-radius-2xl);
  object-fit: contain;
  scroll-snap-align: center;
}

.carousel-button {
  position: absolute;
  top: 50%;
  width: 2.25rem;
  height: 2.25rem;
  display: grid;
  place-items: center;
  background: light-dark(rgb(255 255 255 / 0.85), rgb(15 23 42 / 0.85));
  border-radius: 999px;
  box-shadow: 0 4px 12px rgb(15 23 42 / 0.18);
  color: var(--ui-text);
  transform: translateY(-50%);
  transition: background-color 150ms ease-out;
}

.carousel-button:hover {
  background: light-dark(rgb(255 255 255), rgb(15 23 42));
}

.carousel-button svg {
  width: 1.125rem;
  height: 1.125rem;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

.carousel-button-previous {
  left: var(--space-md);
}

.carousel-button-next {
  right: var(--space-md);
}

.carousel-indicators {
  position: absolute;
  bottom: var(--space-md);
  left: 50%;
  padding: var(--space-sm) var(--space-md);
  display: flex;
  gap: var(--space-sm);
  background: rgb(0 0 0 / 0.6);
  border-radius: 999px;
  transform: translateX(-50%);
}

.carousel-indicator {
  width: 0.375rem;
  height: 0.375rem;
  background: rgb(255 255 255 / 0.4);
  border-radius: 999px;
  transition: background-color 150ms ease-out;
}

.carousel-indicator.active {
  background: white;
}

.dependency-list {
  padding-inline-start: 1.25rem;
  display: grid;
  gap: var(--space-sm);
  color: var(--ui-text-muted);
  line-height: 1.65;
  list-style: disc;
}

.metadata-panel {
  display: grid;
  gap: var(--space-lg);
}

.metadata-list {
  display: grid;
  gap: var(--space-lg);
}

.metadata-list > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  font-size: var(--ui-text-sm);
}

.metadata-list dt,
.metadata-group h3 {
  color: var(--ui-text-subtle);
}

.metadata-list dd {
  overflow-wrap: anywhere;
  color: var(--ui-text);
  text-align: end;
}

.metadata-list .package-id {
  max-width: 65%;
  font-family: theme("font.mono");
  font-size: var(--ui-text-xs);
  user-select: text;
}

.metadata-with-icon {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-sm);
}

.metadata-with-icon svg,
.repository-link svg,
.primary-action svg {
  width: 1rem;
  height: 1rem;
  flex: none;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

.metadata-filter-link {
  text-decoration: underline;
  text-decoration-color: transparent;
  text-underline-offset: 0.18em;
  transition:
    color 150ms ease-out,
    text-decoration-color 150ms ease-out;
}

.metadata-filter-link:hover {
  color: var(--ui-primary-text);
  text-decoration-color: currentColor;
}

.metadata-list .version {
  font-variant-numeric: tabular-nums;
}

.metadata-group {
  display: grid;
  gap: var(--space-sm);
  font-size: var(--ui-text-sm);
}

.chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.chip-list a {
  transition:
    border-color 150ms ease-out,
    color 150ms ease-out;
}

.chip-list a:hover {
  border-color: var(--ui-primary-border);
  color: var(--ui-primary-text);
}

.repository-link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  color: var(--ui-primary-text);
  font-size: var(--ui-text-sm);
  word-break: break-all;
}

.repository-link:hover {
  text-decoration: underline;
  text-underline-offset: 0.2em;
}

.action-panel {
  display: grid;
}

.primary-action {
  width: 100%;
  min-height: 2.5rem;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

:is(.package-description) {
  max-width: none;
  color: var(--ui-text-muted);
  font-size: var(--ui-text-base);
  line-height: 1.75;
  overflow-wrap: anywhere;
  user-select: text;
}

:is(.package-description > :first-child) {
  margin-top: 0;
}

:is(.package-description > :last-child) {
  margin-bottom: 0;
}

:is(.package-description p),
:is(.package-description ul),
:is(.package-description ol),
:is(.package-description blockquote),
:is(.package-description pre),
:is(.package-description table),
:is(.package-description details) {
  margin-block: 1.25em;
}

:is(.package-description h1),
:is(.package-description h2),
:is(.package-description h3),
:is(.package-description h4) {
  color: var(--ui-text-strong);
  font-weight: 700;
  line-height: 1.35;
}

:is(.package-description h1) {
  margin-block: 0 0.9em;
  font-size: 1.625rem;
  line-height: 2.125rem;
}

:is(.package-description h2) {
  margin-block: 1.6em 0.8em;
  font-size: 1.5em;
}

:is(.package-description h3) {
  margin-block: 1.6em 0.6em;
  font-size: 1.25em;
}

:is(.package-description h4) {
  margin-block: 1.5em 0.5em;
  font-size: 1em;
}

:is(.package-description ul),
:is(.package-description ol) {
  padding-inline-start: 1.625em;
}

:is(.package-description ul) {
  list-style: disc;
}

:is(.package-description ol) {
  list-style: decimal;
}

:is(.package-description li + li) {
  margin-top: 0.5em;
}

:is(.package-description li > ul),
:is(.package-description li > ol) {
  margin-block: 0.75em;
}

:is(.package-description strong) {
  color: var(--ui-text-strong);
  font-weight: 700;
}

:is(.package-description a) {
  color: var(--ui-primary-text);
  text-decoration: underline;
  text-underline-offset: 0.2em;
}

:is(.package-description a:focus-visible) {
  outline: 2px solid var(--ui-focus);
  outline-offset: 2px;
}

:is(.package-description img) {
  max-width: 100%;
  height: auto;
  margin-block: 2em;
  border-radius: var(--ui-radius-lg);
}

:is(.package-description pre) {
  padding: var(--space-lg);
  overflow-x: auto;
  background: light-dark(theme("colors.slate.950"), theme("colors.slate.950"));
  border-radius: var(--ui-radius-xl);
  color: theme("colors.slate.100");
  font-size: var(--ui-text-sm);
  line-height: 1.65;
}

:is(.package-description pre code) {
  padding: 0;
  background: transparent;
  border: 0;
  color: inherit;
  font-size: inherit;
}

:is(.package-description :not(pre) > code) {
  padding: 0.15em 0.35em;
  background: light-dark(rgb(148 163 184 / 0.2), rgb(148 163 184 / 0.2));
  border-radius: 0.35rem;
  color: var(--ui-text-strong);
  font-size: 0.875em;
  font-weight: 600;
}

:is(.package-description blockquote) {
  padding-inline-start: 1em;
  border-inline-start: 1px solid var(--ui-border-muted);
  color: var(--ui-text-subtle);
  font-style: italic;
}

:is(.package-description hr) {
  margin-block: 3em;
  border: 0;
  border-top: 1px solid var(--ui-border-muted);
}

:is(.package-description table) {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--ui-text-sm);
  line-height: 1.7;
  text-align: start;
}

:is(.package-description th) {
  color: var(--ui-text-strong);
  font-weight: 700;
}

:is(.package-description th),
:is(.package-description td) {
  padding: 0.6em 0.75em;
  border-bottom: 1px solid var(--ui-border-muted);
  text-align: start;
  vertical-align: top;
}

:is(.package-description details) {
  padding: var(--space-lg);
  background: var(--ui-surface-muted);
  border: 1px solid var(--ui-border);
  border-radius: var(--ui-radius-xl);
}

:is(.package-description summary) {
  color: var(--ui-text-strong);
  font-weight: 700;
  cursor: pointer;
}

:is(.package-description details[open] > summary) {
  margin-bottom: var(--space-lg);
}

:is(.package-description .markdown-badges) {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-sm);
  margin-block: var(--space-lg);
}

:is(.package-description .markdown-badges a) {
  display: inline-flex;
  line-height: 0;
}

:is(.package-description .markdown-badges img) {
  display: block;
  margin: 0;
  border-radius: 0;
}

@media (min-width: 64rem) {
  .package-page {
    gap: var(--space-xl);
  }

  .package-layout {
    grid-template-columns: minmax(0, 1fr) 20rem;
  }

  .sidebar-sticky {
    position: sticky;
    top: var(--space-xl);
  }
}

@media (pointer: coarse) {
  .primary-action,
  .repository-link,
  .breadcrumb a {
    min-height: 3rem;
  }
}
</style>
