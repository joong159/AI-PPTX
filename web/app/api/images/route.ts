import { NextRequest, NextResponse } from 'next/server'

const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY
const PEXELS_KEY = process.env.PEXELS_API_KEY

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q') || 'business'
  const page = req.nextUrl.searchParams.get('page') || '1'

  // Try Unsplash first
  if (UNSPLASH_KEY) {
    try {
      const res = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=20&orientation=landscape`,
        { headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` }, next: { revalidate: 3600 } }
      )
      const data = await res.json()
      const images = (data.results || []).map((img: any) => ({
        id: img.id,
        thumb: img.urls.small,
        regular: img.urls.regular,
        full: img.urls.full,
        alt: img.alt_description || img.description || query,
        author: img.user.name,
        authorUrl: img.user.links.html,
        source: 'unsplash',
      }))
      return NextResponse.json({ images, total: data.total })
    } catch { /**/ }
  }

  // Fallback: Pexels
  if (PEXELS_KEY) {
    try {
      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&page=${page}&per_page=20&orientation=landscape`,
        { headers: { Authorization: PEXELS_KEY }, next: { revalidate: 3600 } }
      )
      const data = await res.json()
      const images = (data.photos || []).map((img: any) => ({
        id: String(img.id),
        thumb: img.src.medium,
        regular: img.src.large,
        full: img.src.original,
        alt: img.alt || query,
        author: img.photographer,
        authorUrl: img.photographer_url,
        source: 'pexels',
      }))
      return NextResponse.json({ images, total: data.total_results })
    } catch { /**/ }
  }

  // No API keys — return demo images using picsum
  const demo = Array.from({ length: 12 }, (_, i) => ({
    id: String(i + 1),
    thumb: `https://picsum.photos/seed/${query}${i}/400/250`,
    regular: `https://picsum.photos/seed/${query}${i}/800/500`,
    full: `https://picsum.photos/seed/${query}${i}/1600/1000`,
    alt: `${query} image ${i + 1}`,
    author: 'Lorem Picsum',
    authorUrl: 'https://picsum.photos',
    source: 'picsum',
  }))
  return NextResponse.json({ images: demo, total: 12, notice: 'UNSPLASH_ACCESS_KEY 또는 PEXELS_API_KEY를 .env.local에 추가하면 실제 이미지를 검색합니다.' })
}
