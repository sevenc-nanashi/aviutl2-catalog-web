<script setup lang="ts">
import type { PackageInfo } from "../../../lib/catalog";
import PackageDescription from "./PackageDescription.vue";
import PackageImageCarousel from "./PackageImageCarousel.vue";

defineProps<{
  packageInfo: PackageInfo;
  descriptionHtml: string;
  screenshots: string[];
}>();
</script>

<template>
  <div class="package-content">
    <section v-if="screenshots.length > 0" class="content-section">
      <h2>スクリーンショット</h2>
      <PackageImageCarousel :images="screenshots" :package-name="packageInfo.name" />
    </section>

    <section class="content-section ui-surface-section">
      <h2>概要</h2>
      <p class="summary">{{ packageInfo.summary }}</p>
      <div v-if="packageInfo.deprecation" class="deprecation" role="note">
        <strong>このパッケージは非推奨です</strong>
        <p>{{ packageInfo.deprecation.message }}</p>
      </div>
    </section>

    <section v-if="packageInfo.description" class="content-section ui-surface-section">
      <h2>説明</h2>
      <PackageDescription :html="descriptionHtml" />
    </section>

    <section v-if="packageInfo.dependencies.length > 0" class="content-section ui-surface-section">
      <h2>依存関係</h2>
      <ul class="dependency-list">
        <li v-for="dependency in packageInfo.dependencies" :key="dependency">
          {{ dependency }}
        </li>
      </ul>
    </section>
  </div>
</template>
