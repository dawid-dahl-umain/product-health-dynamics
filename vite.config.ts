import { defineConfig } from "vitest/config";

export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 4173,
  },
  test: {
    environment: "node",
    reporters: ["default"],
    coverage: {
      provider: "v8",
    },
  },
});
