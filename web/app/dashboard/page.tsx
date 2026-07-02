import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabase } from '@/lib/supabase-server'
import type { PresentationRow } from '@/lib/supabase'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const sb = await createServerSupabase()
  const { data: { user } } = await sb.auth.getUser()

  if (!user) redirect('/auth')

  const { data: presentations } = await sb
    .from('presentations')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  return (
    <DashboardClient
      user={{ email: user.email || '' }}
      presentations={(presentations || []) as PresentationRow[]}
    />
  )
}
