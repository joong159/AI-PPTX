import { createBrowserClient } from '@supabase/ssr'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const SUPABASE_ENABLED = !!(SUPABASE_URL && SUPABASE_ANON_KEY)

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}

export type PresentationRow = {
  id: string
  user_id: string
  title: string
  theme: string
  accent_color: string | null
  slides: Record<string, unknown>[]
  design: Record<string, unknown> | null
  updated_at: string
  created_at: string
}
