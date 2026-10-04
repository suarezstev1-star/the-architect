import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, devices } from "@playwright/test";

// `ui` project: static shell only (needs just the Vite dev server). `app` project: the full stack
// (Auth/Firestore/Storage emulators + e2e server + Vite) and is enabled with E2E_FULL=1.
const full = process.env.E2E_FULL === "1";
const webPort = 5173;
const serverPort = 8787;
const previewPort = 4173;
// The production bundle is served by `vite preview` when `pnpm build` has run (apps/web/dist exists).
const builtWeb = existsSync(resolve(import.meta.dirname, "apps/web/dist/index.html"));
const fakeVoiceWav = resolve(import.meta.dirname, "tests/e2e/.tmp/voice.wav");

const serverEnv = {
  NODE_ENV: "development",
  PORT: String(serverPort),
  GIT_SHA: "e2e",
  LOG_LEVEL: "warn",
  GOOGLE_CLOUD_PROJECT: "demo-pulso",
  FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099",
  FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080",
  FIREBASE_STORAGE_EMULATOR_HOST: "127.0.0.1:9199",
  STORAGE_BUCKET: "demo-pulso.appspot.com",
  ALLOWED_EMAILS: "e2e@pulso.test",
  WEB_ORIGINS: `http://127.0.0.1:${webPort}`,
  STT_MODEL: "test-stt-model",
  STT_LOCATION: "us",
  STT_LANGUAGE: "es-US",
  STT_DAILY_SECONDS_PER_ORG: "1800",
  STT_PRICE_USD_PER_MIN: "0.016",
  SWEEP_AUDIENCE: `http://127.0.0.1:${serverPort}`,
  SCHEDULER_SA_EMAIL: "scheduler@demo-pulso.iam.gserviceaccount.com",
  GEMINI_MODEL: "test-llm-model",
  GEMINI_LOCATION: "global",
  GEMINI_TIMEOUT_MS: "5000",
  FILLERS_FROM_AUDIO: "true",
};

export default defineConfig({
  testDir: "tests/e2e",
  testIgnore: ["**/node_modules/**", "**/blueprints/**"],
  globalSetup: "./tests/e2e/global-setup.ts",
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://127.0.0.1:${webPort}`,
    trace: "retain-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    { name: "ui", testMatch: /ui\/.*\.spec\.ts/, use: { ...devices["Desktop Chrome"] } },
    ...(full
      ? [
          {
            name: "app",
            testMatch: /app\/.*\.spec\.ts/,
            use: {
              ...devices["Desktop Chrome"],
              permissions: ["microphone"],
              launchOptions: {
                args: [
                  "--use-fake-ui-for-media-stream",
                  "--use-fake-device-for-media-stream",
                  `--use-file-for-fake-audio-capture=${fakeVoiceWav}`,
                ],
              },
            },
          },
        ]
      : []),
  ],
  webServer: [
    ...(full
      ? [
          {
            command:
              "pnpm exec firebase emulators:start --only auth,firestore,storage --project demo-pulso",
            url: "http://127.0.0.1:9099",
            reuseExistingServer: !process.env.CI,
            timeout: 120_000,
          },
          {
            command: "pnpm --filter @pulso/server start:e2e",
            url: `http://127.0.0.1:${serverPort}/health`,
            reuseExistingServer: !process.env.CI,
            timeout: 60_000,
            env: serverEnv,
          },
        ]
      : []),
    {
      command: `pnpm --filter @pulso/web exec vite --mode e2e --host 127.0.0.1 --port ${webPort} --strictPort`,
      url: `http://127.0.0.1:${webPort}`,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    ...(builtWeb
      ? [
          {
            command: "pnpm --filter @pulso/web preview",
            url: `http://127.0.0.1:${previewPort}`,
            reuseExistingServer: !process.env.CI,
            timeout: 60_000,
          },
        ]
      : []),
  ],
});
