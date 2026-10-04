import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// `@pulso/shared` resolves to its SOURCE for the web (dev, build and typecheck all agree).
const sharedSrc = fileURLToPath(new URL("../../packages/shared/src/index.ts", import.meta.url));
const repoRoot = fileURLToPath(new URL("../..", import.meta.url));
const apiTarget = "http://127.0.0.1:8787";

// background_color / theme_color repeat the dark `--bg` token on purpose: a manifest cannot read CSS.
// tests/repo/tokens-parity.test.ts asserts they stay equal to the token.
const manifestColor = "#0B0D0C";

export default defineConfig({
  envDir: repoRoot,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/apple-touch-icon.png"],
      manifest: {
        name: "PULSO",
        short_name: "PULSO",
        description: "Entrenador de voz en vivo: tu voz en el monitor.",
        lang: "es",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: manifestColor,
        theme_color: manifestColor,
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api\//, /^\/ws\//, /^\/health/],
        globPatterns: ["**/*.{js,css,html,woff2,png,svg,webmanifest}"],
      },
    }),
  ],
  resolve: { alias: { "@pulso/shared": sharedSrc } },
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": apiTarget,
      "/health": apiTarget,
      "/ws": { target: apiTarget, ws: true },
    },
  },
  build: { target: "es2023", sourcemap: true },
});
