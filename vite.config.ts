import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
    prerender: {
      enabled: true,
      crawlLinks: true,
    },
  },
  nitro: {
    output: {
      dir: "dist",
      publicDir: "dist",
      serverDir: "dist/server",
    },
  },
  vite: {
    server: {
      host: "0.0.0.0",
      port: 8080,
      strictPort: false,
      allowedHosts: true,
    },
  },
});
