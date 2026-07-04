// Shared LLM client for all AI text-generation endpoints (generate/refine/refine-deck).
//
// Uses the official `openai` package pointed at NVIDIA Build's free API
// (https://integrate.api.nvidia.com/v1), not OpenAI's own servers — NVIDIA
// Build exposes a plain OpenAI-shaped /v1/chat/completions endpoint.
//
// NOTE: groq-sdk was tried first (it also accepts a baseURL override) but its
// chat-completions resource hardcodes the request path as
// `/openai/v1/chat/completions` (a GROQ-specific convention, since GROQ's own
// default baseURL has no /v1 suffix). Combined with a baseURL that already
// ends in /v1, that produced a broken double path
// (".../v1/openai/v1/chat/completions" -> 404) confirmed via a live test
// against NVIDIA. The `openai` package posts to plain `/chat/completions`
// with no hardcoded prefix, which is what NVIDIA's endpoint actually expects.
import OpenAI from 'openai'

export function getAiClient() {
  return new OpenAI({
    apiKey: process.env.NVIDIA_API_KEY,
    baseURL: 'https://integrate.api.nvidia.com/v1',
  })
}

// Default model — live-tested against NVIDIA Build's /v1/chat/completions
// with a real API key (confirmed working, noticeably richer writing than the
// old GROQ llama-3.3-70b-versatile setup). Override via NVIDIA_MODEL if you
// want to try something else; prefer a plain instruct/chat model over a
// reasoning model (reasoning models emit a <think> preamble that breaks this
// app's JSON-extraction parsing).
//
// Other confirmed-available fallbacks (also live-tested / listed in this
// account's /v1/models catalog):
//   - meta/llama-3.3-70b-instruct       (same model already used via GROQ — no
//                                        quality upgrade, but a safe fallback)
//   - mistralai/mixtral-8x7b-instruct-v0.1
// Avoid: qwen/qwq-32b (reasoning model), qwen/qwen2.5-coder-32b-instruct
// (code-specialized, not tuned for prose).
export const AI_MODEL = process.env.NVIDIA_MODEL || 'deepseek-ai/deepseek-v4-pro'
