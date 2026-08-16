<script setup lang="ts">
import { I18nT, useI18n } from "vue-i18n";

const { t } = useI18n();
</script>

<template>
  <div un-max-w="md:screen-md" un-mx="auto" un-p="4" un-space-y="2">
    <h1 class="text-xl font-bold mb-4">
      {{ t("about.title") }}
    </h1>
    <I18nT keypath="about.description" tag="p">
      <template #catalog
        ><a
          href="https://github.com/neosku/aviutl2-catalog"
          target="_blank"
          rel="noopener noreferrer"
          class="text-blue-500 hover:underline"
          >{{ t("about.description_link") }}</a
        ></template
      >
    </I18nT>
    <I18nT keypath="about.data" tag="p">
      <template #data_link
        ><a
          href="https://github.com/neosku/aviutl2-catalog-data"
          target="_blank"
          rel="noopener noreferrer"
          class="text-blue-500 hover:underline"
          >{{ t("about.data_link") }}</a
        ></template
      >
    </I18nT>
    <I18nT keypath="about.source" tag="p">
      <template #source_link
        ><a
          href="https://github.com/sevenc-nanashi/aviutl2-catalog-web"
          target="_blank"
          rel="noopener noreferrer"
          class="text-blue-500 hover:underline"
          >{{ t("about.source_link") }}</a
        ></template
      >
    </I18nT>
  </div>
</template>
