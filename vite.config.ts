import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
    prerender: {
      enabled: false,
    },
  },
  nitro: {
    preset: "cloudflare-module",
  },
  vite: {
  resolve: {
    tsconfigPaths: true,
  },
  // ...
}
});