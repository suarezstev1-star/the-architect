// Deterministic environment for every server test. `??=` keeps values the Firebase emulators
// export (FIRESTORE_EMULATOR_HOST, FIREBASE_AUTH_EMULATOR_HOST, ...) when running under
// `firebase emulators:exec`. A model id here is a test double, never a real Gemini id.
const defaults: Record<string, string> = {
  NODE_ENV: "test",
  PORT: "0",
  GIT_SHA: "test",
  LOG_LEVEL: "silent",
  GOOGLE_CLOUD_PROJECT: "demo-pulso",
  GCLOUD_PROJECT: "demo-pulso",
  ALLOWED_EMAILS: "allowed@pulso.test,second@pulso.test",
  WEB_ORIGINS: "http://127.0.0.1:5173",
  STT_MODEL: "test-stt-model",
  STT_LOCATION: "us",
  STT_LANGUAGE: "es-US",
  STT_DAILY_SECONDS_PER_ORG: "1800",
  STT_PRICE_USD_PER_MIN: "0.016",
  STORAGE_BUCKET: "demo-pulso.appspot.com",
  SWEEP_AUDIENCE: "http://127.0.0.1:8787",
  SCHEDULER_SA_EMAIL: "scheduler@demo-pulso.iam.gserviceaccount.com",
  GEMINI_MODEL: "test-llm-model",
  GEMINI_LOCATION: "global",
  GEMINI_TIMEOUT_MS: "5000",
  FILLERS_FROM_AUDIO: "true",
};

for (const [key, value] of Object.entries(defaults)) {
  process.env[key] ??= value;
}
