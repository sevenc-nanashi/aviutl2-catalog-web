<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import Card from "../../components/Card.vue";
import Switch from "../../components/Switch.vue";
import CodeBlock from "../../components/CodeBlock.vue";
import { debouncedComputed } from "../../lib/debouncedComputed";

const choices = {
  markdown: "Markdown",
  html: "HTML",
  url: "URL",
} as const;
const { t } = useI18n({ useScope: "global" });
const choice = ref<keyof typeof choices>("markdown");
const packageId = ref("");

const pageUrl = computed(() => {
  if (!packageId.value) {
    return "";
  }
  return `${window.location.origin}/package/${encodeURIComponent(packageId.value)}`;
});
const badgeUrl = computed(() => {
  if (!packageId.value) {
    return "";
  }
  return `${window.location.origin}/badge/v/${encodeURIComponent(packageId.value)}`;
});
const markdownCode = computed(() => {
  if (!packageId.value) {
    return t("badge.packageId");
  }
  return `[![AviUtl2 Catalog](${badgeUrl.value})](${pageUrl.value})`;
});
const htmlCode = computed(() => {
  if (!packageId.value) {
    return t("badge.packageId");
  }
  return `<a href="${pageUrl.value}"><img src="${badgeUrl.value}" alt="AviUtl2 Catalog"></a>`;
});

const debouncedBadgeUrl = debouncedComputed(500, () => badgeUrl.value);
</script>

<template>
  <div un-max-w="md:screen-md" un-mx="auto" un-p="4" un-space-y="2">
    <h1 class="text-xl font-bold mb-4">{{ t("badge.title") }}</h1>
    <p>{{ t("badge.packageId") }}</p>
    <input
      v-model="packageId"
      type="text"
      placeholder="sevenc-nanashi.aviutl2-rs.rusty_scripts_search"
      un-w="full"
    />

    <Card un-space-y="4">
      <template #header>
        <Switch :choices="Object.keys(choices)" v-model="choice">
          <template #markdown>Markdown</template>
          <template #html>HTML</template>
          <template #url>URL</template>
        </Switch>
      </template>

      <div v-if="choice === 'markdown' || choice === 'html'" un-space-y="4">
        <p>{{ t("badge.codeHelp") }}</p>
        <CodeBlock :code="choice === 'markdown' ? markdownCode : htmlCode" />
      </div>
      <div v-else-if="choice === 'url'" un-space-y="4">
        <p>{{ t("badge.badgeUrlHelp") }}</p>
        <CodeBlock :code="badgeUrl || t('badge.packageId')" />
        <p>{{ t("badge.pageUrlHelp") }}</p>
        <CodeBlock :code="pageUrl || t('badge.packageId')" />
      </div>
      <p>
        {{ t("badge.preview") }}
        <img
          v-if="debouncedBadgeUrl"
          :src="debouncedBadgeUrl"
          alt="AviUtl2 Catalog Badge"
          un-inline-block
        />
        <span v-else>{{ t("badge.none") }}</span>
      </p>
    </Card>
  </div>
</template>
