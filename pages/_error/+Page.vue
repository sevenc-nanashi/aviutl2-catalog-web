<script lang="ts" setup>
import { usePageContext } from "vike-vue/usePageContext";
import { useI18n } from "vue-i18n";

const pageContext = usePageContext();
const { t } = useI18n({ useScope: "global" });
</script>
<template>
  <div un-max-w="md:screen-md" un-mx="auto" un-p="4" un-space-y="2">
    <h1 v-if="pageContext.is404" class="text-xl font-bold mb-4">
      {{ t("error.notFoundTitle") }}
    </h1>
    <h1 v-else class="text-xl font-bold mb-4">{{ t("error.genericTitle") }}</h1>
    <p v-if="pageContext.is404">{{ t("error.notFoundDescription") }}</p>
    <p v-else>{{ t("error.genericDescription") }}</p>
  </div>
</template>
