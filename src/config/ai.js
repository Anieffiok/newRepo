export default {
  provider: "gemini",
  get apiKey() {
    return process.env.GEMINI_API_KEY;
  },
  get model() {
    return process.env.AI_MODEL || "gemini-3.1-flash-lite";
  },
  get fallbackModel() {
    return process.env.AI_FALLBACK_MODEL || "gemini-3.6-flash";
  },
  maxOutputTokens: 1024,
  temperature: 0.3,
  get enabled() {
    return !!process.env.GEMINI_API_KEY;
  },
};
