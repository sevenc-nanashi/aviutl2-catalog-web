<script setup lang="ts">
import { useI18n } from "vue-i18n";
import Card from "../../components/Card.vue";
import {
  packageCategories,
  type PackageCategory,
  type PackageDeprecationFilter,
  type PackageSortOrder,
} from "../../lib/packageList";

const { t } = useI18n({ useScope: "global" });

const deprecationIconByValue = {
  active: "i-lucide-circle-check-big",
  deprecated: "i-lucide-triangle-alert",
  all: "i-lucide-triangle-alert",
} as const satisfies Record<PackageDeprecationFilter, string>;

const sortIconByValue = {
  popularity_desc: "i-lucide-crown",
  trend_desc: "i-lucide-trending-up",
  added_desc: "i-lucide-calendar-plus",
  updated_desc: "i-lucide-calendar-clock",
} as const satisfies Record<PackageSortOrder, string>;

defineProps<{
  searchQuery: string;
  selectedCategory: PackageCategory;
  selectedTags: string[];
  allTags: string[];
  deprecationFilter: PackageDeprecationFilter;
  sortOrder: PackageSortOrder;
  tagsExpanded: boolean;
  resultCount: number;
}>();

const emit = defineEmits<{
  "update:searchQuery": [value: string];
  "update:selectedCategory": [value: PackageCategory];
  "update:deprecationFilter": [value: PackageDeprecationFilter];
  "update:sortOrder": [value: PackageSortOrder];
  "update:tagsExpanded": [value: boolean];
  toggleTag: [tag: string];
  clearTags: [];
}>();

function handleSearch(event: Event): void {
  if (!(event.target instanceof HTMLInputElement)) {
    throw new Error("Package search target is not an input element");
  }
  emit("update:searchQuery", event.target.value);
}

function handleDeprecation(event: Event): void {
  if (!(event.target instanceof HTMLSelectElement)) {
    throw new Error("Deprecation filter target is not a select element");
  }
  emit("update:deprecationFilter", event.target.value as PackageDeprecationFilter);
}

function handleSort(event: Event): void {
  if (!(event.target instanceof HTMLSelectElement)) {
    throw new Error("Package sort target is not a select element");
  }
  emit("update:sortOrder", event.target.value as PackageSortOrder);
}
</script>

<template>
  <Card class="package-filters" :aria-label="t('home.search.region')">
    <div class="filter-primary-row">
      <label class="search-field">
        <span aria-hidden="true" class="i-lucide-search search-icon" />
        <span class="sr-only">{{ t("home.search.label") }}</span>
        <input
          type="search"
          :value="searchQuery"
          :placeholder="t('home.search.placeholder')"
          @input="handleSearch"
        />
        <button
          v-if="searchQuery"
          type="button"
          class="search-clear ui-icon-button ui-focus-ring"
          :aria-label="t('home.search.clear')"
          @click="emit('update:searchQuery', '')"
        >
          <span aria-hidden="true" class="i-lucide-x" />
        </button>
      </label>

      <div class="quick-filters">
        <div class="filter-heading">
          <span aria-hidden="true" class="i-lucide-filter heading-icon" />
          <span>{{ t("home.filters.label") }}</span>
        </div>
        <label class="select-control">
          <span
            aria-hidden="true"
            :class="deprecationIconByValue[deprecationFilter]"
            class="control-icon"
          />
          <select
            :aria-label="t('home.filters.deprecation')"
            :value="deprecationFilter"
            @change="handleDeprecation"
          >
            <option value="active">{{ t("home.deprecationStatus.active") }}</option>
            <option value="deprecated">{{ t("home.deprecationStatus.deprecated") }}</option>
            <option value="all">{{ t("home.deprecationStatus.all") }}</option>
          </select>
        </label>
        <button
          type="button"
          class="tag-toggle ui-button ui-button-action ui-button-secondary ui-focus-ring"
          :class="{ active: tagsExpanded || selectedTags.length > 0 }"
          :aria-expanded="tagsExpanded"
          @click="emit('update:tagsExpanded', !tagsExpanded)"
        >
          <span aria-hidden="true" class="i-lucide-filter tag-filter-icon" />
          {{ t("common.labels.tags") }}
          <span v-if="selectedTags.length > 0" class="tag-count">{{ selectedTags.length }}</span>
          <span
            aria-hidden="true"
            :class="tagsExpanded ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
            class="toggle-icon"
          />
        </button>
      </div>
    </div>

    <div class="category-row">
      <div class="category-heading">
        <span aria-hidden="true" class="i-lucide-layers heading-icon" />
        <span>{{ t("home.filters.category") }}</span>
      </div>
      <div class="category-tabs" role="group" :aria-label="t('home.filters.categoryAria')">
        <button
          v-for="category in packageCategories"
          :key="category.key"
          type="button"
          :class="{ active: selectedCategory === category.key }"
          :aria-pressed="selectedCategory === category.key"
          @click="emit('update:selectedCategory', category.key)"
        >
          {{ t(`common.packageTypes.${category.translationKey}`) }}
        </button>
      </div>
      <div class="result-count">
        <strong>{{ resultCount }}</strong
        ><span>{{ t("home.filters.count") }}</span>
      </div>
      <div class="sort-heading">
        <span aria-hidden="true" class="i-lucide-arrow-up-down heading-icon" />
        <span>{{ t("home.filters.sort") }}</span>
      </div>
      <label class="select-control">
        <span aria-hidden="true" :class="sortIconByValue[sortOrder]" class="control-icon" />
        <select :aria-label="t('home.filters.sort')" :value="sortOrder" @change="handleSort">
          <option value="popularity_desc">{{ t("home.sortOptions.popularity_desc") }}</option>
          <option value="trend_desc">{{ t("home.sortOptions.trend_desc") }}</option>
          <option value="added_desc">{{ t("home.sortOptions.added_desc") }}</option>
          <option value="updated_desc">{{ t("home.sortOptions.updated_desc") }}</option>
        </select>
      </label>
    </div>

    <div v-if="selectedTags.length > 0 && !tagsExpanded" class="selected-tags">
      <span>{{ t("home.filters.selected") }}</span>
      <button v-for="tag in selectedTags" :key="tag" type="button" @click="emit('toggleTag', tag)">
        {{ tag }}
        <span aria-hidden="true" class="i-lucide-x selected-tag-icon" />
      </button>
      <button type="button" class="clear-tags" @click="emit('clearTags')">
        {{ t("home.filters.clearAll") }}
      </button>
    </div>

    <div v-if="tagsExpanded" class="all-tags">
      <div class="all-tags-heading">
        <strong>
          <span aria-hidden="true" class="i-lucide-tags heading-icon" />
          {{ t("home.filters.allTags") }}
        </strong>
        <button v-if="selectedTags.length > 0" type="button" @click="emit('clearTags')">
          {{ t("home.filters.clearSelection") }}
        </button>
      </div>
      <div class="tag-cloud">
        <button
          v-for="tag in allTags"
          :key="tag"
          type="button"
          :class="{ active: selectedTags.includes(tag) }"
          :aria-pressed="selectedTags.includes(tag)"
          @click="emit('toggleTag', tag)"
        >
          {{ tag }}
        </button>
      </div>
    </div>
  </Card>
</template>

<style scoped>
.package-filters {
  position: sticky;
  top: 0;
  z-index: 20;
  padding: var(--ui-space-3) var(--ui-space-6);
  display: grid;
  gap: var(--ui-space-3);
  background: color-mix(in srgb, var(--ui-surface) 96%, transparent);
  border-bottom: 1px solid var(--ui-border);
  box-shadow: var(--ui-shadow-sm);
}

.filter-primary-row,
.category-row,
.quick-filters,
.filter-heading,
.select-control,
.category-heading,
.sort-heading,
.result-count,
.tag-toggle,
.selected-tags,
.all-tags-heading,
.all-tags-heading strong {
  display: flex;
  align-items: center;
}

.filter-primary-row {
  flex-wrap: wrap;
  gap: var(--ui-space-3);
}

.search-field {
  position: relative;
  min-width: 10rem;
  max-width: 42rem;
  flex: 1;
}

.search-icon {
  position: absolute;
  top: 50%;
  left: var(--ui-space-3);
  width: 1.125rem;
  height: 1.125rem;
  color: var(--ui-text-subtle);
  transform: translateY(-50%);
}

.search-field input {
  width: 100%;
  padding-left: 2.5rem;
  padding-right: 2.5rem;
}

.search-clear {
  position: absolute;
  top: 50%;
  right: var(--ui-space-3);
  width: 1.375rem;
  height: 1.375rem;
  transform: translateY(-50%);
}

.search-clear span {
  width: 0.875rem;
  height: 0.875rem;
}

.quick-filters {
  margin-left: auto;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--ui-space-2);
}

.filter-heading,
.category-heading,
.sort-heading {
  gap: var(--ui-space-1);
  color: var(--ui-text-subtle);
  font-size: var(--ui-text-xs);
  font-weight: 700;
  letter-spacing: 0.08em;
}

.heading-icon {
  width: 0.875rem;
  height: 0.875rem;
  opacity: 0.7;
}

.select-control {
  position: relative;
}

.select-control select {
  min-height: 2.375rem;
  padding-left: 2.25rem;
  font-size: var(--ui-text-sm);
  font-weight: 500;
}

.control-icon {
  position: absolute;
  left: var(--ui-space-3);
  z-index: 1;
  width: 1rem;
  height: 1rem;
  color: var(--ui-text-muted);
  pointer-events: none;
}

.category-row {
  min-width: 0;
  gap: var(--ui-space-3);
}

.category-tabs {
  min-width: 0;
  padding: var(--ui-space-1);
  overflow-x: auto;
  display: flex;
  gap: var(--ui-space-1);
  background: var(--ui-surface-muted);
  border: 1px solid var(--ui-border);
  border-radius: var(--ui-radius-lg);
}

.category-tabs button {
  padding: var(--ui-space-2) var(--ui-space-3);
  border-radius: 0.375rem;
  color: var(--ui-text-muted);
  font-size: var(--ui-text-sm);
  font-weight: 500;
  white-space: nowrap;
}

.category-tabs button.active {
  background: var(--ui-primary);
  color: white;
  box-shadow: var(--ui-shadow-sm);
}

.result-count {
  margin-left: auto;
  min-height: 2.375rem;
  padding-inline: var(--ui-space-3);
  gap: var(--ui-space-1);
  justify-content: center;
  background: var(--ui-surface-muted);
  border: 1px solid var(--ui-border);
  border-radius: var(--ui-radius-lg);
  color: var(--ui-text-muted);
}

.result-count strong {
  color: var(--ui-text);
  font-size: var(--ui-text-lg);
  font-variant-numeric: tabular-nums;
}

.result-count span {
  font-size: var(--ui-text-xs);
  font-weight: 700;
}

.tag-toggle {
  gap: var(--ui-space-2);
}

.tag-toggle.active {
  background: var(--ui-primary-soft);
  border-color: var(--ui-primary-border);
}

.tag-count {
  width: 1.25rem;
  height: 1.25rem;
  display: grid;
  place-items: center;
  background: var(--ui-primary);
  border-radius: 999px;
  color: white;
  font-size: 0.625rem;
}

.tag-filter-icon,
.toggle-icon {
  width: 1rem;
  height: 1rem;
}

.selected-tags {
  flex-wrap: wrap;
  gap: var(--ui-space-2);
  color: var(--ui-text-subtle);
  font-size: var(--ui-text-sm);
}

.selected-tags button,
.tag-cloud button {
  padding: var(--ui-space-1) var(--ui-space-3);
  background: var(--ui-surface);
  border: 1px solid var(--ui-border);
  border-radius: 999px;
  color: var(--ui-text-muted);
  font-size: var(--ui-text-xs);
}

.selected-tags button:not(.clear-tags) {
  display: inline-flex;
  align-items: center;
  gap: var(--ui-space-1);
  border-radius: 0.375rem;
  font-size: var(--ui-text-sm);
}

.selected-tag-icon {
  width: 0.875rem;
  height: 0.875rem;
}

.selected-tags button:not(.clear-tags),
.tag-cloud button.active {
  background: var(--ui-primary-soft);
  border-color: var(--ui-primary-border);
  color: var(--ui-primary-text);
}

.selected-tags .clear-tags,
.all-tags-heading button {
  padding: 0;
  background: transparent;
  border: 0;
  color: var(--ui-primary-text);
  text-decoration: underline;
  text-underline-offset: 0.2em;
}

.all-tags {
  padding-top: var(--ui-space-3);
  display: grid;
  gap: var(--ui-space-3);
  border-top: 1px solid var(--ui-divider);
}

.all-tags-heading {
  justify-content: space-between;
  color: var(--ui-text-subtle);
  font-size: var(--ui-text-sm);
}

.all-tags-heading strong {
  gap: var(--ui-space-1);
  letter-spacing: 0.08em;
}

.tag-cloud {
  max-height: 18rem;
  overflow-y: auto;
  display: flex;
  flex-wrap: wrap;
  gap: var(--ui-space-2);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
}

@media (max-width: 48rem) {
  .package-filters {
    position: static;
    padding-inline: var(--ui-space-4);
  }

  .filter-primary-row {
    align-items: stretch;
    flex-direction: column;
  }

  .quick-filters {
    margin-left: 0;
    justify-content: flex-start;
  }

  .category-row {
    flex-wrap: wrap;
  }

  .category-tabs {
    width: 100%;
    order: 5;
  }

  .result-count {
    margin-left: auto;
  }
}
</style>
