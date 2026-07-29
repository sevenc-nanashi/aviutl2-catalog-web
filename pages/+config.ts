import type { Config } from "vike/types";
import vikeVue from "vike-vue/config";

// Default config (can be overridden by pages)
// https://vike.dev/config

export default {
  // https://vike.dev/head-tags
  title: "AviUtl2 Catalog Web",
  description: "AviUtl2 Catalogの非公式Webビューワー",

  extends: [vikeVue],
} as Config;
