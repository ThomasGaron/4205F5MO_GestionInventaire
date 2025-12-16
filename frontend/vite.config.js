import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./vitest.setup.ts",
    css: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "./coverage",
      lines: 75,
      branches: 75,
      functions: 75,
      statements: 75,
      all: true,
      include: [
        "src/components/**/*.{js,jsx,ts,tsx}",
        "src/page*/**/*.{js,jsx,ts,tsx}",
        "src/lib/**/*.{js,jsx,ts,tsx}",
      ],
      exclude: [
        "**/*.{test,spec}.{js,jsx,ts,tsx}",
        "**/__tests__/**",
        "node_modules/**",
        "dist/**",
        "coverage/**",
      ],
    },
  },
});
