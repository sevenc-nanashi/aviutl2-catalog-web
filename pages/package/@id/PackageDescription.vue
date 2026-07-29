<script setup lang="ts">
import { onMounted, ref } from "vue";

defineProps<{
  html: string;
}>();

const descriptionElement = ref<HTMLElement>();

async function highlightCodeBlocks(): Promise<void> {
  if (import.meta.env.SSR) {
    throw new Error("Code highlighting is only available in the browser");
  }
  const element = descriptionElement.value;
  if (element === undefined) {
    throw new Error("Package description element is undefined");
  }
  const codeBlocks = [...element.querySelectorAll<HTMLPreElement>("pre")];
  if (codeBlocks.length === 0) {
    return;
  }

  const { bundledLanguages, codeToHtml } = await import("shiki");
  await Promise.all(
    codeBlocks.map(async (preElement) => {
      const codeElement = preElement.querySelector("code");
      if (codeElement === null) {
        throw new Error("Markdown code block has no code element");
      }
      const languageName = [...codeElement.classList]
        .find((className) => className.startsWith("language-"))
        ?.slice("language-".length);
      const language =
        languageName !== undefined && languageName in bundledLanguages ? languageName : "text";
      const highlightedHtml = await codeToHtml(codeElement.textContent, {
        lang: language,
        theme: "dark-plus",
      });
      preElement.outerHTML = highlightedHtml;
    }),
  );
}

onMounted(() => {
  void highlightCodeBlocks();
});
</script>

<template>
  <div
    ref="descriptionElement"
    class="package-description prose prose-slate max-w-none select-text"
    v-html="html"
  />
</template>
