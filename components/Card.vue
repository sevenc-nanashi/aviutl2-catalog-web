<script setup lang="ts">
defineOptions({ inheritAttrs: false });
</script>
<template>
  <div class="card ui-surface">
    <div
      v-if="$slots.header"
      un-py="3"
      un-px="6"
      un-border-b="1 slate-100 dark:slate-800"
      un-bg="slate-50 dark:slate-900/50"
      class="font-bold text-sm"
    >
      <slot name="header" />
    </div>
    <div un-p="5" v-bind="$attrs">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.card {
  color: var(--ui-text-muted);
  margin-bottom: calc(theme("spacing") * 4);

  @apply text-sm;
}
</style>
