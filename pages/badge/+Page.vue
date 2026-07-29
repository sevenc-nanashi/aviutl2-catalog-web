<script setup lang="ts">
import { computed, ref } from "vue";
import Card from "../../components/Card.vue";
import Switch from "../../components/Switch.vue";
import CodeBlock from "../../components/CodeBlock.vue";
import { debouncedComputed } from "../../lib/debouncedComputed";

const choices = {
  markdown: "Markdown",
  html: "HTML",
  url: "URL",
} as const;
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
    return "パッケージIDを入力してください。";
  }
  return `[![AviUtl2 Catalog](${badgeUrl.value})](${pageUrl.value})`;
});
const htmlCode = computed(() => {
  if (!packageId.value) {
    return "パッケージIDを入力してください。";
  }
  return `<a href="${pageUrl.value}"><img src="${badgeUrl.value}" alt="AviUtl2 Catalog"></a>`;
});

const debouncedBadgeUrl = debouncedComputed(500, () => badgeUrl.value);
</script>

<template>
  <div un-max-w="md:screen-md" un-mx="auto" un-p="4" un-space-y="2">
    <h1 class="text-xl font-bold mb-4">バッジを作成</h1>
    <p>パッケージIDを入力してください。</p>
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
        <p>以下のコードをコピーして、READMEなどに貼り付けてください。</p>
        <CodeBlock :code="choice === 'markdown' ? markdownCode : htmlCode" />
      </div>
      <div v-else-if="choice === 'url'" un-space-y="4">
        <p>以下のURLをコピーして、バッジ画像のURLとして使用してください。</p>
        <CodeBlock :code="badgeUrl || 'パッケージIDを入力してください。'" />
        <p>以下のURLにアクセスすると、カタログを開くページに移動します。</p>
        <CodeBlock :code="pageUrl || 'パッケージIDを入力してください。'" />
      </div>
      <p>
        プレビュー：
        <img
          v-if="debouncedBadgeUrl"
          :src="debouncedBadgeUrl"
          alt="AviUtl2 Catalog Badge"
          un-inline-block
        />
        <span v-else>（なし）</span>
      </p>
    </Card>
  </div>
</template>
