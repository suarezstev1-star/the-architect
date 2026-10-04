import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// One convention for every loader: relative specifiers keep the `.ts` extension, and the workspace
// package `@pulso/shared` resolves to its SOURCE (no build needed before tests).
const sharedSrc = fileURLToPath(new URL("./packages/shared/src/index.ts", import.meta.url));
const alias = { "@pulso/shared": sharedSrc };
const exclude = ["**/node_modules/**", "**/dist/**", "blueprints/**", "tests/e2e/**"];

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      include: ["packages/shared/src/**/*.ts"],
      exclude: ["**/*.test.ts"],
    },
    projects: [
      {
        resolve: { alias },
        test: {
          name: "shared",
          environment: "node",
          include: ["packages/shared/**/*.test.ts"],
          exclude,
        },
      },
      {
        resolve: { alias },
        test: {
          name: "server",
          environment: "node",
          include: ["apps/server/**/*.test.ts", "tests/repo/**/*.test.ts"],
          exclude: [...exclude, "apps/server/tests/emulator/**"],
          setupFiles: ["apps/server/tests/setup.ts"],
        },
      },
      {
        plugins: [react()],
        resolve: { alias },
        test: {
          name: "web",
          environment: "jsdom",
          include: ["apps/web/**/*.test.{ts,tsx}"],
          exclude,
          setupFiles: ["apps/web/tests/setup.ts"],
        },
      },
      {
        resolve: { alias },
        test: {
          name: "emulator",
          environment: "node",
          include: ["apps/server/tests/emulator/**/*.test.ts"],
          exclude: ["**/node_modules/**", "**/dist/**", "blueprints/**"],
          setupFiles: ["apps/server/tests/setup.ts"],
          fileParallelism: false,
          testTimeout: 30000,
          hookTimeout: 30000,
        },
      },
    ],
  },
});
