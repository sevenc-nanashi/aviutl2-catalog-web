<script setup lang="ts">
import { computed } from "vue";
import { latestReleaseDate, type PackageInfo } from "../../lib/catalog";
import { packageCategory, packageThumbnail, type PackageCategory } from "../../lib/packageList";
import { shouldShowDirectDownload } from "../../lib/packageDownload";

const thumbnailIconByCategory = {
  core: "i-lucide-app-window",
  mod: "i-lucide-app-window",
  "input-plugin": "i-lucide-file-input",
  "output-plugin": "i-lucide-file-output",
  "general-plugin": "i-lucide-puzzle",
  "filter-plugin": "i-lucide-sliders-horizontal",
  script: "i-lucide-file-code-2",
  other: "i-lucide-package",
} as const satisfies Record<Exclude<PackageCategory, "all">, string>;

const props = defineProps<{ packageInfo: PackageInfo }>();
const emit = defineEmits<{ openDetail: [] }>();

const detailUrl = computed(() => `/package/${encodeURIComponent(props.packageInfo.id)}`);
const downloadUrl = computed(
  () => `/api/package/${encodeURIComponent(props.packageInfo.id)}/download`,
);
const directDownload = computed(() => shouldShowDirectDownload(props.packageInfo));
const thumbnail = computed(() => packageThumbnail(props.packageInfo));
const thumbnailIcon = computed(() => thumbnailIconByCategory[packageCategory(props.packageInfo)]);
const updatedDate = computed(() => {
  const date = latestReleaseDate(props.packageInfo);
  return date === undefined ? "?" : date.replaceAll("-", "/");
});
</script>

<template>
  <article class="package-card">
    <a
      :href="detailUrl"
      class="card-main-link ui-focus-ring"
      :aria-label="`${packageInfo.name}の詳細を表示`"
      @click="emit('openDetail')"
    />
    <div class="card-body">
      <h2 :class="{ deprecated: packageInfo.deprecation }">{{ packageInfo.name }}</h2>
      <span v-if="packageInfo.deprecation" class="deprecated-chip">非推奨</span>
      <div class="card-meta">
        <span>
          <span aria-hidden="true" class="i-lucide-user meta-icon" />
          {{ packageInfo.author || "?" }}
        </span>
        <span>
          <span aria-hidden="true" class="i-lucide-calendar meta-icon" />
          {{ updatedDate }}
        </span>
      </div>
      <p>{{ packageInfo.summary }}</p>
      <div class="card-tags">
        <span v-for="tag in packageInfo.tags.slice(0, 3)" :key="tag">{{ tag }}</span>
        <span v-if="packageInfo.tags.length > 3">+{{ packageInfo.tags.length - 3 }}</span>
      </div>
      <div class="card-action">
        <a
          v-if="directDownload"
          :href="downloadUrl"
          class="download-action ui-focus-ring"
          @click.stop
        >
          <span aria-hidden="true" class="i-lucide-download action-icon" />
          直接ダウンロード
        </a>
        <a v-else :href="detailUrl" class="detail-action ui-focus-ring" @click="emit('openDetail')">
          詳細表示
        </a>
      </div>
    </div>
    <div class="card-thumbnail">
      <img v-if="thumbnail" :src="thumbnail" :alt="packageInfo.name" loading="lazy" />
      <div v-else class="thumbnail-placeholder" aria-hidden="true">
        <div class="thumbnail-icon-tile">
          <span :class="thumbnailIcon" class="thumbnail-icon" />
        </div>
      </div>
      <span>{{ packageInfo.type || "その他" }}</span>
    </div>
  </article>
</template>

<style scoped>
.package-card {
  position: relative;
  min-width: 0;
  height: 13rem;
  overflow: hidden;
  display: flex;
  background: var(--ui-surface);
  border: 1px solid var(--ui-border);
  border-radius: var(--ui-radius-2xl);
  transition:
    border-color 300ms ease-out,
    box-shadow 300ms ease-out,
    transform 300ms ease-out;
}

.package-card:hover {
  border-color: var(--ui-primary-border);
  box-shadow: 0 12px 30px rgb(15 23 42 / 0.09);
  transform: translateY(-2px);
}

.card-main-link {
  position: absolute;
  inset: 0;
  z-index: 1;
  border-radius: inherit;
}

.card-body {
  min-width: 0;
  padding: var(--ui-space-4);
  display: flex;
  flex: 1;
  flex-direction: column;
}

.card-body h2 {
  overflow: hidden;
  color: var(--ui-text);
  font-size: var(--ui-text-xl);
  font-weight: 700;
  letter-spacing: -0.02em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-body h2.deprecated {
  color: light-dark(theme("colors.amber.700"), theme("colors.amber.300"));
}

.deprecated-chip {
  width: fit-content;
  margin-top: var(--ui-space-1);
  padding: 0.125rem var(--ui-space-2);
  background: light-dark(theme("colors.amber.50"), rgb(120 53 15 / 0.25));
  border: 1px solid light-dark(theme("colors.amber.200"), theme("colors.amber.800"));
  border-radius: 999px;
  color: light-dark(theme("colors.amber.700"), theme("colors.amber.300"));
  font-size: 0.625rem;
  font-weight: 700;
}

.card-meta {
  margin-top: var(--ui-space-1);
  display: flex;
  gap: var(--ui-space-3);
  color: var(--ui-text-subtle);
  font-size: var(--ui-text-sm);
}

.card-meta span {
  min-width: 0;
  display: inline-flex;
  align-items: center;
  gap: var(--ui-space-1);
}

.card-meta span:first-child {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meta-icon,
.action-icon {
  width: 0.875rem;
  height: 0.875rem;
  flex: none;
}

.card-body p {
  margin-top: var(--ui-space-2);
  overflow: hidden;
  display: -webkit-box;
  color: var(--ui-text-subtle);
  font-size: 0.9375rem;
  line-height: 1.45;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.card-tags {
  margin-top: auto;
  display: flex;
  flex-wrap: wrap;
  gap: var(--ui-space-1);
}

.card-tags span {
  padding: 0.125rem var(--ui-space-2);
  background: var(--ui-surface-muted);
  border: 1px solid var(--ui-border);
  border-radius: 0.375rem;
  color: var(--ui-text-subtle);
  font-size: 0.625rem;
}

.card-action {
  margin-top: var(--ui-space-1);
  z-index: 2;
  display: flex;
  justify-content: flex-end;
}

.card-action a {
  min-width: 8.75rem;
  min-height: 2.25rem;
  padding-inline: var(--ui-space-3);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--ui-space-2);
  border-radius: var(--ui-radius-lg);
  font-size: var(--ui-text-xs);
  font-weight: 700;
}

.download-action {
  background: var(--ui-primary);
  color: white;
}

.detail-action {
  background: light-dark(theme("colors.slate.500"), theme("colors.slate.200"));
  color: light-dark(theme("colors.slate.50"), theme("colors.slate.900"));
  box-shadow: 0 4px 12px rgb(15 23 42 / 0.16);
  transition:
    background-color 180ms ease-out,
    box-shadow 180ms ease-out,
    transform 180ms ease-out;
}

.detail-action:hover {
  background: light-dark(theme("colors.slate.600"), theme("colors.slate.300"));
  box-shadow: 0 6px 16px rgb(15 23 42 / 0.2);
}

.detail-action:active {
  box-shadow: var(--ui-shadow-sm);
  transform: scale(0.98);
}

.card-thumbnail {
  position: relative;
  width: 13rem;
  flex: none;
  background: var(--ui-surface-muted);
  border-left: 1px solid var(--ui-border);
}

.card-thumbnail img,
.thumbnail-placeholder {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.thumbnail-placeholder {
  position: relative;
  display: grid;
  place-items: center;
  background: var(--ui-surface);
}

.thumbnail-placeholder::before {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0);
  background-size: 1rem 1rem;
  color: var(--ui-text-subtle);
  content: "";
  opacity: 0.06;
}

.thumbnail-icon-tile {
  position: relative;
  width: 4rem;
  height: 4rem;
  display: grid;
  place-items: center;
  background: color-mix(in srgb, var(--ui-surface-muted) 72%, transparent);
  border: 1px solid color-mix(in srgb, var(--ui-border) 70%, transparent);
  border-radius: var(--ui-radius-xl);
  box-shadow: var(--ui-shadow-sm);
  transition:
    background-color 500ms ease-out,
    transform 500ms ease-out;
}

.thumbnail-icon-tile::before {
  position: absolute;
  inset: -1rem;
  z-index: -1;
  background: color-mix(in srgb, var(--ui-primary) 6%, transparent);
  border-radius: 999px;
  content: "";
  filter: blur(1rem);
  transition: background-color 500ms ease-out;
}

.package-card:hover .thumbnail-icon-tile {
  background: color-mix(in srgb, var(--ui-primary-soft) 35%, var(--ui-surface-muted));
  transform: scale(1.1);
}

.package-card:hover .thumbnail-icon-tile::before {
  background: color-mix(in srgb, var(--ui-primary) 11%, transparent);
}

.thumbnail-icon {
  width: 2rem;
  height: 2rem;
  color: var(--ui-text-subtle);
}

.card-thumbnail > span {
  position: absolute;
  top: var(--ui-space-2);
  right: var(--ui-space-2);
  max-width: calc(100% - var(--ui-space-4));
  padding: var(--ui-space-1) var(--ui-space-2);
  overflow: hidden;
  background: color-mix(in srgb, var(--ui-surface) 90%, transparent);
  border: 1px solid var(--ui-border);
  border-radius: 0.375rem;
  color: var(--ui-text-muted);
  font-size: 0.625rem;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 38rem) {
  .package-card {
    height: 12rem;
  }

  .card-thumbnail {
    width: 7.5rem;
  }

  .card-action a {
    min-width: 6.5rem;
  }

  .card-body {
    padding: var(--ui-space-3);
  }

  .card-body h2 {
    font-size: var(--ui-text-lg);
  }

  .card-body p {
    -webkit-line-clamp: 2;
  }
}
</style>
