import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { presentationId } = await req.json()
  if (!presentationId) return NextResponse.json({ error: 'Missing presentationId' }, { status: 400 })

  // Check ownership
  const { data: pres } = await supabase
    .from('presentations')
    .select('id, share_token, is_public')
    .eq('id', presentationId)
    .eq('user_id', user.id)
    .single()

  if (!pres) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // If already has a token, return it; otherwise generate one
  let token = pres.share_token
  if (!token) {
    token = crypto.randomUUID().replace(/-/g, '')
    await supabase.from('presentations').update({ share_token: token, is_public: true }).eq('id', presentationId)
  } else if (!pres.is_public) {
    await supabase.from('presentations').update({ is_public: true }).eq('id', presentationId)
  }

  return NextResponse.json({ token, url: `/view/${token}` })
}

export async function DELETE(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { presentationId } = await req.json()
  await supabase.from('presentations').update({ is_public: false }).eq('id', presentationId).eq('user_id', user.id)

  return NextResponse.json({ ok: true })
}
