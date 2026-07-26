import type { Config } from "vike/types";
import vikeVue from "vike-vue/config";

// Default config (can be overridden by pages)
// https://vike.dev/config

export default {
  // https://vike.dev/head-tags
  title: "AviUtl2 Catalog Badge",
  description: "AviUtl2 Catalogの非公式バッジ。",

  extends: [vikeVue],
} as Config;
