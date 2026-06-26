import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["__tests__/setup.ts"],
    globals: true,
    exclude: ["node_modules/**", "e2e/**"],
    coverage: {
      reporter: ["text", "html"],
      exclude: ["node_modules/", "__tests__/setup.ts"],
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "."),
    },
  },
});
