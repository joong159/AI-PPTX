// Curated Google Fonts for presentations
export interface FontOption {
  name: string
  family: string
  category: 'sans-serif' | 'serif' | 'display' | 'monospace'
  weights: string
}

export const FONTS: FontOption[] = [
  // Sans-serif
  { name: 'Noto Sans KR', family: "'Noto Sans KR', sans-serif", category: 'sans-serif', weights: '400;700' },
  { name: 'Pretendard', family: "'Pretendard', sans-serif", category: 'sans-serif', weights: '400;700' },
  { name: 'Inter', family: "'Inter', sans-serif", category: 'sans-serif', weights: '400;700' },
  { name: 'Roboto', family: "'Roboto', sans-serif", category: 'sans-serif', weights: '400;700' },
  { name: 'Open Sans', family: "'Open Sans', sans-serif", category: 'sans-serif', weights: '400;700' },
  { name: 'Lato', family: "'Lato', sans-serif", category: 'sans-serif', weights: '400;700' },
  { name: 'Poppins', family: "'Poppins', sans-serif", category: 'sans-serif', weights: '400;700' },
  { name: 'Nunito', family: "'Nunito', sans-serif", category: 'sans-serif', weights: '400;700' },
  // Serif
  { name: 'Noto Serif KR', family: "'Noto Serif KR', serif", category: 'serif', weights: '400;700' },
  { name: 'Playfair Display', family: "'Playfair Display', serif", category: 'serif', weights: '400;700' },
  { name: 'Merriweather', family: "'Merriweather', serif", category: 'serif', weights: '400;700' },
  { name: 'Georgia', family: "Georgia, serif", category: 'serif', weights: '' },
  // Display
  { name: 'Bebas Neue', family: "'Bebas Neue', sans-serif", category: 'display', weights: '400' },
  { name: 'Oswald', family: "'Oswald', sans-serif", category: 'display', weights: '400;700' },
  { name: 'Raleway', family: "'Raleway', sans-serif", category: 'display', weights: '400;700' },
  { name: 'Montserrat', family: "'Montserrat', sans-serif", category: 'display', weights: '400;700' },
  // Monospace
  { name: 'Fira Code', family: "'Fira Code', monospace", category: 'monospace', weights: '400;700' },
  { name: 'JetBrains Mono', family: "'JetBrains Mono', monospace", category: 'monospace', weights: '400;700' },
]

export const DEFAULT_FONT = FONTS[0]

const loadedFonts = new Set<string>()

export function loadGoogleFont(font: FontOption) {
  if (!font.weights || loadedFonts.has(font.name)) return
  loadedFonts.add(font.name)
  const encodedFamily = encodeURIComponent(font.name) + ':wght@' + font.weights
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${encodedFamily}&display=swap`
  document.head.appendChild(link)
}

export function preloadAllFonts() {
  FONTS.forEach(f => loadGoogleFont(f))
}
