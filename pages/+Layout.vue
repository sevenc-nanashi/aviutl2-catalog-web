<!-- https://vike.dev/Layout -->

<template>
  <header class="site-header">
    <a href="/" class="ui-focus-ring">AviUtl2 Catalog Web</a>
  </header>
  <div un-p="4">
    <slot />
  </div>
  <div un-flex-grow />
  <footer class="site-footer">
    <a
      href="https://github.com/sevenc-nanashi/aviutl2-catalog-badge"
      target="_blank"
      rel="noopener noreferrer"
      class="link"
      >AviUtl2 Catalog Web</a
    >
    &copy; 2026
    <a
      href="https://sevenc7c.com"
      target="_blank"
      rel="noopener noreferrer"
      class="link"
      un-text="![#48b0d5]"
      >Nanashi.</a
    >
    / このページはAviUtl2 Catalogと関係のない非公式のページです。
  </footer>
</template>

<script lang="ts" setup>
import "@unocss/reset/tailwind-v4.css";
import "@fontsource/noto-sans-jp/400.css";
import "@fontsource/noto-sans-jp/700.css";
import "virtual:uno.css";
import "./design-system.css";
import "./style.css";
</script>
