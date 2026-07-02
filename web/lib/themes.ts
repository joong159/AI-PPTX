export interface Theme {
  id: string
  name: string
  preview: string // gradient CSS for thumbnail
  bg: string
  bgGradient?: string
  headerBg: string
  headerGradient?: string
  headerText: string
  accent: string
  accentLight: string
  bodyText: string
  subtleText: string
  cardBg: string
  cardBorder: string
  bulletDot: string
  kwBg: string
  kwBorder: string
  kwText: string
  sectionBg: string
  sectionText: string
  statColor: string
  decorStyle: 'none' | 'circles' | 'lines' | 'dots' | 'geo'
}

export const THEMES: Theme[] = [
  {
    id: 'modern',
    name: 'Modern',
    preview: 'linear-gradient(135deg, #4F46E5 0%, #818CF8 100%)',
    bg: '#F8F9FF',
    headerBg: '#4F46E5',
    headerGradient: 'linear-gradient(135deg, #4F46E5, #6366F1)',
    headerText: '#ffffff',
    accent: '#4F46E5',
    accentLight: '#818CF8',
    bodyText: '#1e293b',
    subtleText: '#64748b',
    cardBg: '#EEF2FF',
    cardBorder: '#C7D2FE',
    bulletDot: '#4F46E5',
    kwBg: '#EEF2FF',
    kwBorder: '#4F46E5',
    kwText: '#3730A3',
    sectionBg: '#4F46E5',
    sectionText: '#ffffff',
    statColor: '#4F46E5',
    decorStyle: 'circles',
  },
  {
    id: 'dark',
    name: 'Dark Pro',
    preview: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #312E81 100%)',
    bg: '#0F172A',
    bgGradient: 'linear-gradient(145deg, #0F172A 0%, #1E1B4B 100%)',
    headerBg: '#1E293B',
    headerGradient: 'linear-gradient(90deg, #312E81, #1E293B)',
    headerText: '#ffffff',
    accent: '#818CF8',
    accentLight: '#C7D2FE',
    bodyText: '#E2E8F0',
    subtleText: '#94A3B8',
    cardBg: '#1E293B',
    cardBorder: '#334155',
    bulletDot: '#818CF8',
    kwBg: '#1E293B',
    kwBorder: '#818CF8',
    kwText: '#C7D2FE',
    sectionBg: '#1E1B4B',
    sectionText: '#ffffff',
    statColor: '#818CF8',
    decorStyle: 'dots',
  },
  {
    id: 'gradient',
    name: 'Gradient',
    preview: 'linear-gradient(135deg, #667eea 0%, #f093fb 50%, #f5576c 100%)',
    bg: '#ffffff',
    headerBg: '#667eea',
    headerGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    headerText: '#ffffff',
    accent: '#667eea',
    accentLight: '#a78bfa',
    bodyText: '#1e293b',
    subtleText: '#64748b',
    cardBg: '#faf5ff',
    cardBorder: '#e9d5ff',
    bulletDot: '#7c3aed',
    kwBg: 'linear-gradient(135deg, #fdf4ff, #ede9fe)',
    kwBorder: '#a78bfa',
    kwText: '#5b21b6',
    sectionBg: 'linear-gradient(135deg, #667eea 0%, #f093fb 100%)',
    sectionText: '#ffffff',
    statColor: '#7c3aed',
    decorStyle: 'geo',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    preview: 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)',
    bg: '#ffffff',
    headerBg: '#ffffff',
    headerGradient: undefined,
    headerText: '#0f172a',
    accent: '#0f172a',
    accentLight: '#475569',
    bodyText: '#0f172a',
    subtleText: '#94a3b8',
    cardBg: '#f8fafc',
    cardBorder: '#e2e8f0',
    bulletDot: '#0f172a',
    kwBg: '#f8fafc',
    kwBorder: '#cbd5e1',
    kwText: '#475569',
    sectionBg: '#0f172a',
    sectionText: '#ffffff',
    statColor: '#0f172a',
    decorStyle: 'lines',
  },
  {
    id: 'corporate',
    name: 'Corporate',
    preview: 'linear-gradient(135deg, #1e3a5f 0%, #2d5986 50%, #c9a84c 100%)',
    bg: '#F0F4F8',
    headerBg: '#1e3a5f',
    headerGradient: 'linear-gradient(135deg, #1e3a5f, #2d5986)',
    headerText: '#ffffff',
    accent: '#c9a84c',
    accentLight: '#e5c97a',
    bodyText: '#1e3a5f',
    subtleText: '#4a6fa5',
    cardBg: '#ffffff',
    cardBorder: '#c9a84c',
    bulletDot: '#c9a84c',
    kwBg: '#1e3a5f',
    kwBorder: '#c9a84c',
    kwText: '#ffffff',
    sectionBg: '#1e3a5f',
    sectionText: '#c9a84c',
    statColor: '#c9a84c',
    decorStyle: 'lines',
  },
  {
    id: 'creative',
    name: 'Creative',
    preview: 'linear-gradient(135deg, #f97316 0%, #ec4899 50%, #8b5cf6 100%)',
    bg: '#fffbf5',
    headerBg: '#f97316',
    headerGradient: 'linear-gradient(135deg, #f97316, #ec4899)',
    headerText: '#ffffff',
    accent: '#f97316',
    accentLight: '#fdba74',
    bodyText: '#1c1917',
    subtleText: '#78716c',
    cardBg: '#fff7ed',
    cardBorder: '#fed7aa',
    bulletDot: '#f97316',
    kwBg: '#fff7ed',
    kwBorder: '#f97316',
    kwText: '#9a3412',
    sectionBg: 'linear-gradient(135deg, #f97316, #ec4899)',
    sectionText: '#ffffff',
    statColor: '#f97316',
    decorStyle: 'circles',
  },
]

export const DEFAULT_THEME_ID = 'modern'
export function getTheme(id: string): Theme {
  return THEMES.find(t => t.id === id) || THEMES[0]
}
