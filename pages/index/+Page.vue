<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from "vue";
import { useData } from "vike-vue/useData";
import { z } from "zod";
import {
  filterAndSortPackages,
  packageListHistoryStateSchema,
  packageListTags,
  type PackageCategory,
  type PackageDeprecationFilter,
  type PackageListHistoryState,
  type PackageListItem,
  type PackageSortOrder,
} from "../../lib/packageList";
import PackageListCard from "./PackageListCard.vue";
import PackageListFilters from "./PackageListFilters.vue";
import type { Data } from "./+data";

const historyEnvelopeSchema = z
  .object({
    aviutl2CatalogPackageList: packageListHistoryStateSchema.optional(),
  })
  .passthrough();

const data = useData<Data>();
const items: PackageListItem[] = data.packages.map((packageInfo, catalogIndex) => ({
  packageInfo,
  catalogIndex,
}));

const searchQuery = ref("");
const selectedCategory = ref<PackageCategory>("all");
const selectedTags = ref<string[]>([]);
const deprecationFilter = ref<PackageDeprecationFilter>("active");
const sortOrder = ref<PackageSortOrder>("popularity_desc");
const tagsExpanded = ref(false);

const allTags = packageListTags(items);
const filteredPackages = computed(() =>
  filterAndSortPackages(items, {
    searchQuery: searchQuery.value,
    selectedCategory: selectedCategory.value,
    selectedTags: selectedTags.value,
    deprecationFilter: deprecationFilter.value,
    sortOrder: sortOrder.value,
  }),
);

function toggleTag(tag: string): void {
  selectedTags.value = selectedTags.value.includes(tag)
    ? selectedTags.value.filter((selectedTag) => selectedTag !== tag)
    : [...selectedTags.value, tag];
}

function clearConditions(): void {
  searchQuery.value = "";
  selectedCategory.value = "all";
  selectedTags.value = [];
  deprecationFilter.value = "active";
  sortOrder.value = "popularity_desc";
  tagsExpanded.value = false;
}

function currentHistoryState(): PackageListHistoryState {
  return {
    searchQuery: searchQuery.value,
    selectedCategory: selectedCategory.value,
    selectedTags: selectedTags.value,
    deprecationFilter: deprecationFilter.value,
    sortOrder: sortOrder.value,
    tagsExpanded: tagsExpanded.value,
    scrollY: window.scrollY,
  };
}

function saveHistoryState(): void {
  const parsedHistory = historyEnvelopeSchema.safeParse(window.history.state);
  const historyState = parsedHistory.success ? parsedHistory.data : {};
  window.history.replaceState(
    {
      ...historyState,
      aviutl2CatalogPackageList: currentHistoryState(),
    },
    "",
  );
}

function consumeHistoryState(historyState: z.infer<typeof historyEnvelopeSchema>): void {
  const nextHistoryState = { ...historyState };
  delete nextHistoryState.aviutl2CatalogPackageList;
  window.history.replaceState(nextHistoryState, "");
}

onMounted(() => {
  const parsedHistory = historyEnvelopeSchema.safeParse(window.history.state);
  if (!parsedHistory.success) {
    return;
  }
  const savedState = parsedHistory.data.aviutl2CatalogPackageList;
  if (savedState === undefined) {
    return;
  }
  searchQuery.value = savedState.searchQuery;
  selectedCategory.value = savedState.selectedCategory;
  selectedTags.value = savedState.selectedTags;
  deprecationFilter.value = savedState.deprecationFilter;
  sortOrder.value = savedState.sortOrder;
  tagsExpanded.value = savedState.tagsExpanded;
  consumeHistoryState(parsedHistory.data);
  void nextTick(() => {
    window.scrollTo({ top: savedState.scrollY, behavior: "instant" });
  });
});
</script>

<template>
  <main class="package-list-page">
    <PackageListFilters
      :search-query="searchQuery"
      :selected-category="selectedCategory"
      :selected-tags="selectedTags"
      :all-tags="allTags"
      :deprecation-filter="deprecationFilter"
      :sort-order="sortOrder"
      :tags-expanded="tagsExpanded"
      :result-count="filteredPackages.length"
      @update:search-query="searchQuery = $event"
      @update:selected-category="selectedCategory = $event"
      @update:deprecation-filter="deprecationFilter = $event"
      @update:sort-order="sortOrder = $event"
      @update:tags-expanded="tagsExpanded = $event"
      @toggle-tag="toggleTag"
      @clear-tags="selectedTags = []"
    />

    <div class="package-list-content">
      <div v-if="filteredPackages.length > 0" class="package-grid">
        <PackageListCard
          v-for="item in filteredPackages"
          :key="item.packageInfo.id"
          :package-info="item.packageInfo"
          @open-detail="saveHistoryState"
        />
      </div>
      <section v-else class="empty-state">
        <span aria-hidden="true" class="i-lucide-package-search empty-state-icon" />
        <p>条件に一致するパッケージはありません</p>
        <button type="button" @click="clearConditions">条件をクリア</button>
      </section>
    </div>
  </main>
</template>

<style scoped>
.package-list-page {
  width: min(100%, 96rem);
  margin-inline: auto;
  overflow: clip;
  background: var(--ui-page);
  border: 1px solid var(--ui-border);
  border-radius: var(--ui-radius-2xl);
}

.package-list-content {
  padding: var(--ui-space-6);
}

.package-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 31rem), 1fr));
  gap: var(--ui-space-6);
}

.empty-state {
  min-height: 20rem;
  display: grid;
  place-items: center;
  align-content: center;
  gap: var(--ui-space-3);
  border: 1px dashed var(--ui-border-muted);
  border-radius: var(--ui-radius-xl);
  color: var(--ui-text-subtle);
  text-align: center;
}

.empty-state-icon {
  width: 3rem;
  height: 3rem;
  opacity: 0.5;
}

.empty-state button {
  color: var(--ui-primary-text);
  font-size: var(--ui-text-sm);
  text-decoration: underline;
  text-underline-offset: 0.2em;
}

@media (max-width: 48rem) {
  .package-list-page {
    border-inline: 0;
    border-radius: 0;
  }

  .package-list-content {
    padding: var(--ui-space-4);
  }

  .package-grid {
    gap: var(--ui-space-4);
  }
}
</style>
