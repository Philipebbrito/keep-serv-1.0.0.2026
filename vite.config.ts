import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redireciona a entrada do servidor incluída no TanStack Start para src/server.ts
    servidor: { entrada: "servidor" },
  },
  vite: {
    server: {
      host: "0.0.0.0",
      port: 8080,
      strictPort: true,
      allowedHosts: [".app.github.dev"],
    },
  },
});