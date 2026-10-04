import { vi } from "vitest";

// React 19 needs this flag so `act()` works outside a testing library. The web tests render with
// `react-dom/client` + `act` from "react" (no @testing-library dependency is pinned).
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
process.env.TZ = "UTC";

// Same values as `.env.example`, so `src/lib/env.ts` parses in jsdom tests without a `.env` file.
// `??=` keeps anything a test or the shell already set.
const viteDefaults: Record<string, string> = {
  VITE_FIREBASE_API_KEY: "demo-api-key",
  VITE_FIREBASE_AUTH_DOMAIN: "demo-pulso.firebaseapp.com",
  VITE_FIREBASE_PROJECT_ID: "demo-pulso",
  VITE_FIREBASE_APP_ID: "1:000000000000:web:0000000000000000000000",
  VITE_USE_EMULATORS: "true",
  VITE_API_URL: "",
  VITE_WS_URL: "",
};

for (const [key, value] of Object.entries(viteDefaults)) {
  process.env[key] ??= value;
  (import.meta.env as Record<string, unknown>)[key] ??= value;
}

// `?worker&url` only resolves inside Vite's bundler graph, so no Vitest run may load it. Step 8
// puts that suffix in exactly one module, `src/audio/worklet-url.ts`; this mock replaces it for
// every web test. The path is relative to THIS file (`apps/web/tests/`); the mock is harmless
// before step 8 creates the module because nothing imports it yet.
vi.mock("../src/audio/worklet-url.ts", () => ({ workletUrl: "/worklet.js" }));
