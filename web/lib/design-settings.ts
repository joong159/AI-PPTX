import type { Theme } from './themes'

export type SlideSize = '16:9' | '4:3' | 'A4'
export type FontFamily = 'sans' | 'serif' | 'mono' | 'round'

export interface DesignSettings {
  size: SlideSize
  font: FontFamily
  paletteId: string
  bgColor: string
  accentColor: string
  textColor: string
}

export const SLIDE_SIZES: { id: SlideSize; label: string; ratio: number; desc: string }[] = [
  { id: '16:9', label: '와이드스크린', ratio: 56.25, desc: '발표·화면용 (기본)' },
  { id: '4:3',  label: '스탠다드',    ratio: 75,    desc: '구형 프로젝터·출력용' },
  { id: 'A4',   label: 'A4 세로',    ratio: 141.4,  desc: '인쇄·보고서용' },
]

export const FONT_OPTIONS: { id: FontFamily; label: string; css: string; preview: string }[] = [
  { id: 'sans',  label: 'Modern Sans',  css: "'Segoe UI', system-ui, sans-serif",      preview: 'Aa' },
  { id: 'serif', label: 'Elegant Serif', css: "'Georgia', 'Times New Roman', serif",    preview: 'Aa' },
  { id: 'mono',  label: 'Tech Mono',    css: "'Courier New', 'Consolas', monospace",    preview: 'Aa' },
  { id: 'round', label: 'Friendly Round', css: "'Trebuchet MS', 'Verdana', sans-serif", preview: 'Aa' },
]

export interface ColorPalette {
  id: string
  name: string
  accent: string
  bg: string
  text: string
  preview: string[]
}

export const COLOR_PALETTES: ColorPalette[] = [
  { id: 'indigo',   name: 'Indigo',    accent: '#4F46E5', bg: '#F8F9FF', text: '#1e293b', preview: ['#4F46E5','#818CF8','#F8F9FF'] },
  { id: 'blue',     name: 'Ocean',     accent: '#0EA5E9', bg: '#F0F9FF', text: '#0c4a6e', preview: ['#0EA5E9','#38BDF8','#F0F9FF'] },
  { id: 'violet',   name: 'Violet',    accent: '#7C3AED', bg: '#FAF5FF', text: '#1e1b4b', preview: ['#7C3AED','#A78BFA','#FAF5FF'] },
  { id: 'rose',     name: 'Rose',      accent: '#E11D48', bg: '#FFF1F2', text: '#1e0a0e', preview: ['#E11D48','#FB7185','#FFF1F2'] },
  { id: 'emerald',  name: 'Emerald',   accent: '#059669', bg: '#ECFDF5', text: '#064e3b', preview: ['#059669','#34D399','#ECFDF5'] },
  { id: 'amber',    name: 'Amber',     accent: '#D97706', bg: '#FFFBEB', text: '#1c1005', preview: ['#D97706','#FCD34D','#FFFBEB'] },
  { id: 'slate',    name: 'Slate',     accent: '#475569', bg: '#F8FAFC', text: '#0f172a', preview: ['#475569','#94A3B8','#F8FAFC'] },
  { id: 'black',    name: 'Midnight',  accent: '#18181B', bg: '#09090B', text: '#FAFAFA', preview: ['#18181B','#52525B','#09090B'] },
]

export const DEFAULT_DESIGN: DesignSettings = {
  size: '16:9',
  font: 'sans',
  paletteId: 'indigo',
  bgColor: '#F8F9FF',
  accentColor: '#4F46E5',
  textColor: '#1e293b',
}

export function getPalette(id: string): ColorPalette {
  return COLOR_PALETTES.find(p => p.id === id) || COLOR_PALETTES[0]
}

export function getFontCss(id: FontFamily): string {
  return FONT_OPTIONS.find(f => f.id === id)?.css || FONT_OPTIONS[0].css
}

export function getSizeRatio(size: SlideSize): number {
  return SLIDE_SIZES.find(s => s.id === size)?.ratio ?? 56.25
}

export function applyDesignToTheme(theme: Theme, design: DesignSettings): Theme {
  const palette = getPalette(design.paletteId)
  const bg = design.bgColor || palette.bg
  return {
    ...theme,
    bg,
    bgGradient: design.bgColor ? undefined : theme.bgGradient,
    accent: palette.accent,
    accentLight: palette.accent + 'AA',
    bodyText: palette.text,
    subtleText: palette.text + '99',
    bulletDot: palette.accent,
    statColor: palette.accent,
    headerBg: palette.accent,
    headerGradient: undefined,
    kwBorder: palette.accent,
    kwBg: bg,
    kwText: palette.text,
    cardBg: bg,
    cardBorder: palette.accent + '40',
    sectionBg: palette.accent,
    sectionText: '#ffffff',
  }
}
