<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import type { PackageInfo } from "../../../lib/catalog";
import { latestReleaseDate } from "../../../lib/catalog";
import { shouldShowDirectDownload } from "../../../lib/packageDownload";
import { packageTypeTranslationKey } from "../../../lib/packageList";

const props = defineProps<{
  packageInfo: PackageInfo;
}>();
const { locale, t } = useI18n({ useScope: "global" });

const catalogUrl = computed(() => `aviutl2-catalog://package/${props.packageInfo.id}`);
const directDownloadUrl = computed(
  () => `/api/package/${encodeURIComponent(props.packageInfo.id)}/download`,
);
const showDirectDownload = computed(() => shouldShowDirectDownload(props.packageInfo));
const latestDate = computed(() => {
  const releaseDate = latestReleaseDate(props.packageInfo);
  if (releaseDate === undefined) {
    return t("package.sidebar.versionUnknown");
  }
  return new Intl.DateTimeFormat(locale.value, {
    dateStyle: "medium",
  }).format(new Date(`${releaseDate}T00:00:00Z`));
});
const licenseTypes = computed(() => props.packageInfo.licenses.map((license) => license.type));
const packageType = computed(() => {
  const translationKey = packageTypeTranslationKey(props.packageInfo);
  if (translationKey === undefined) {
    return props.packageInfo.type || "?";
  }
  return t(`common.packageTypes.${translationKey}`);
});
</script>

<template>
  <aside class="package-sidebar" :aria-label="t('package.sidebar.region')">
    <div class="sidebar-sticky">
      <section class="metadata-panel ui-surface-section">
        <h2 class="sr-only">{{ t("package.sidebar.region") }}</h2>
        <dl class="metadata-list">
          <div>
            <dt>{{ t("common.labels.id") }}</dt>
            <dd class="package-id">{{ packageInfo.id }}</dd>
          </div>
          <div>
            <dt>{{ t("common.labels.author") }}</dt>
            <dd class="metadata-with-icon">
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="M19 21a7 7 0 0 0-14 0" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              {{ packageInfo.author }}
            </dd>
          </div>
          <div v-if="packageInfo.originalAuthor">
            <dt>{{ t("package.sidebar.originalAuthor") }}</dt>
            <dd>{{ packageInfo.originalAuthor }}</dd>
          </div>
          <div>
            <dt>{{ t("common.labels.type") }}</dt>
            <dd>{{ packageType }}</dd>
          </div>
          <div>
            <dt>{{ t("package.sidebar.updatedAt") }}</dt>
            <dd class="metadata-with-icon">
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="M8 2v4M16 2v4M3 10h18" />
                <rect x="3" y="4" width="18" height="18" rx="2" />
              </svg>
              {{ latestDate }}
            </dd>
          </div>
          <div>
            <dt>{{ t("package.sidebar.latestVersion") }}</dt>
            <dd class="version">{{ packageInfo["latest-version"] }}</dd>
          </div>
          <div v-if="packageInfo.niconiCommonsId">
            <dt>{{ t("common.labels.niconiCommonsId") }}</dt>
            <dd>{{ packageInfo.niconiCommonsId }}</dd>
          </div>
        </dl>

        <div v-if="packageInfo.tags.length > 0" class="metadata-group">
          <h3>{{ t("common.labels.tags") }}</h3>
          <div class="chip-list">
            <span v-for="tag in packageInfo.tags" :key="tag" class="ui-badge ui-badge-neutral">
              #{{ tag }}
            </span>
          </div>
        </div>

        <div v-if="licenseTypes.length > 0" class="metadata-group">
          <h3>{{ t("common.labels.licenses") }}</h3>
          <div class="chip-list">
            <span
              v-for="(license, index) in licenseTypes"
              :key="`${license}-${index}`"
              class="ui-badge ui-badge-neutral"
            >
              {{ license }}
            </span>
          </div>
        </div>

        <a
          v-if="packageInfo.repoURL"
          :href="packageInfo.repoURL"
          class="repository-link ui-focus-ring"
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path
              d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
            />
          </svg>
          <span>{{ t("package.sidebar.repository") }}</span>
        </a>
      </section>

      <section class="action-panel ui-surface-section">
        <a
          v-if="showDirectDownload"
          :href="directDownloadUrl"
          class="primary-action ui-button ui-button-primary ui-focus-ring"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14" />
          </svg>
          {{ t("package.sidebar.directDownload") }}
        </a>
        <a
          v-else
          :href="catalogUrl"
          class="primary-action ui-button ui-button-neutral-primary ui-focus-ring"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path
              d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
            />
          </svg>
          {{ t("package.sidebar.openCatalog") }}
        </a>
      </section>
    </div>
  </aside>
</template>
