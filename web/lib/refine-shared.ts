// Shared helpers for the AI slide-editing endpoints (/api/refine, /api/refine-deck).
import type { Slide } from './types'

export function extractJson(raw: string): any {
  // 1) direct parse
  try { return JSON.parse(raw) } catch {}
  // 2) strip markdown code fences
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  if (fence) try { return JSON.parse(fence[1]) } catch {}
  // 3) greedy brace match
  const brace = raw.match(/\{[\s\S]*\}/)
  if (brace) try { return JSON.parse(brace[0]) } catch {}
  return null
}

// Fields that are pure transport/rendering state, never authored by the model,
// and can be large (fabricState) — strip before sending to the LLM so it isn't
// paying tokens (and truncation risk) to echo them back verbatim.
const TRANSPORT_FIELDS = ['fabricState', 'imageUrl', 'image_prompt', 'templateId'] as const

export function stripTransportFields(slide: Slide): Partial<Slide> {
  const stripped: any = { ...slide }
  for (const f of TRANSPORT_FIELDS) delete stripped[f]
  return stripped
}

// Re-attach the stripped fields (from the original slide) onto the model's
// edited slide, and force back the identity fields the model must not change.
export function restoreTransportFields(edited: any, original: Slide): Slide {
  const restored = { ...edited }
  for (const f of TRANSPORT_FIELDS) {
    const value = original[f as keyof Slide]
    if (value !== undefined) restored[f] = value
  }
  restored._id = original._id
  restored.slide_index = original.slide_index
  return restored as Slide
}
