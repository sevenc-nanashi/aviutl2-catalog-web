<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import type { PackageInfo } from "../../../lib/catalog";
import { packageTypeTranslationKey } from "../../../lib/packageList";

const props = defineProps<{
  packageInfo: PackageInfo;
  heroImage?: string;
}>();
const { t } = useI18n({ useScope: "global" });
const packageType = computed(() => {
  const translationKey = packageTypeTranslationKey(props.packageInfo);
  if (translationKey === undefined) {
    return props.packageInfo.type;
  }
  return t(`common.packageTypes.${translationKey}`);
});

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
      <span class="ui-badge ui-badge-primary">{{
        packageInfo.type ? packageType : t("package.header.uncategorized")
      }}</span>
      <h1>{{ packageInfo.name }}</h1>
    </div>
  </header>
</template>
