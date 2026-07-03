import { notFound } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Metadata } from 'next'
import type { Presentation } from '@/lib/types'
import ViewerClient from './ViewerClient'

interface Props {
  params: Promise<{ shareId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { shareId } = await params
  return {
    title: 'SlideAI — 공유된 프레젠테이션',
    description: '슬라이드를 확인해보세요',
    openGraph: { title: 'SlideAI 프레젠테이션', description: 'AI로 만든 프레젠테이션' },
  }
}

export default async function ViewPage({ params }: Props) {
  const { shareId } = await params

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">
        <p className="text-white/50">공유 기능을 사용하려면 Supabase 설정이 필요합니다.</p>
      </div>
    )
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { data } = await supabase
    .from('presentations')
    .select('title, theme, accent_color, slides')
    .eq('share_token', shareId)
    .eq('is_public', true)
    .single()

  if (!data) return notFound()

  const presentation: Presentation = {
    title: data.title,
    theme: data.theme || 'modern',
    accent_color: data.accent_color || '#4F46E5',
    slides: (data.slides as any[]) || [],
  }

  return <ViewerClient presentation={presentation} />
}
