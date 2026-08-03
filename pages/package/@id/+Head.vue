<script setup lang="ts">
import { computed } from "vue";
import { useData } from "vike-vue/useData";
import type { Data } from "./+data";

const data = useData<Data>();
const title = computed(() => `${data.packageInfo.name} | AviUtl2 Catalog Web`);
</script>

<template>
  <meta property="og:type" content="website" />
  <meta property="og:title" :content="title" />
  <meta property="og:description" :content="data.packageInfo.summary" />
  <meta property="og:image" :content="data.ogImageUrl" />
  <meta property="og:image:type" content="image/png" />
  <meta property="og:image:width" content="1280" />
  <meta property="og:image:height" content="640" />
  <meta property="og:image:alt" :content="data.packageInfo.name" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" :content="title" />
  <meta name="twitter:description" :content="data.packageInfo.summary" />
  <meta name="twitter:image" :content="data.ogImageUrl" />
  <meta name="twitter:image:alt" :content="data.packageInfo.name" />
</template>
