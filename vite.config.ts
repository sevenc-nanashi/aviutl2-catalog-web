import vue from "@vitejs/plugin-vue";
import vike from "vike/plugin";
import uno from "unocss/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    cloudflare({
      viteEnvironment: { name: "ssr" },
    }),
    vike(),
    vue(),
    uno(),
  ],
});
