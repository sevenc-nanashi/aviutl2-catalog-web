import path from "node:path";
import vue from "@vitejs/plugin-vue";
import vike from "vike/plugin";
import uno from "unocss/vite";
import license from "rollup-plugin-license";
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
    license({
      cwd: process.cwd(),

      thirdParty: {
        output: {
          file: path.join(
            import.meta.dirname,
            "dist",
            "client",
            "THIRD_PARTY_NOTICES.txt",
          ),
          encoding: "utf-8",
        },
      },
    }),
  ],
  build: {
    rolldownOptions: {
      output: {
        postBanner:
          "/** Check out the THIRD_PARTY_NOTICES.txt file for License information. */",
      },
    },
  },
});
