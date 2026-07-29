<script setup lang="ts">
import { computed } from "vue";
import type { PackageInfo } from "../../../lib/catalog";

const props = defineProps<{
  packageInfo: PackageInfo;
  heroImage?: string;
}>();

const heroStyle = computed(() => {
  if (props.heroImage === undefined) {
    return undefined;
  }
  return {
    "--hero-image": `url("${props.heroImage}")`,
  };
});
</script>

<template>
  <header class="package-hero ui-surface" :class="{ 'has-image': heroImage }" :style="heroStyle">
    <div class="package-heading">
      <span class="ui-badge ui-badge-primary">{{ packageInfo.type || "未分類" }}</span>
      <h1>{{ packageInfo.name }}</h1>
    </div>
  </header>
</template>
