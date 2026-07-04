export type SlideType =
  | 'title_and_content'
  | 'section_header'
  | 'big_stat'
  | 'three_cards'
  | 'timeline'
  | 'two_column'
  | 'team_grid'
  | 'quote_slide'
  | 'image_text'
  | 'comparison'

export interface Card {
  card_title: string
  card_content: string
}

export interface TimelineStep {
  step_title: string
  step_desc: string
}

export interface Slide {
  _id: string
  slide_index: number
  slide_type: SlideType
  title: string
  summary: string
  bullets: string[]
  key_takeaway: string
  speaker_notes: string
  stat_value?: string
  stat_description?: string
  cards?: Card[]
  timeline_steps?: TimelineStep[]
  fabricState?: string  // JSON from fabric canvas.toJSON()
  imageUrl?: string     // AI-generated or stock image URL
  image_prompt?: string // English prompt used to generate imageUrl
  templateId?: string   // HTML template ID (from html-templates.ts)
}

export interface Presentation {
  id?: string
  title: string
  theme: string
  accent_color: string
  slides: Slide[]
  created_at?: string
  updated_at?: string
}

export interface GenerateRequest {
  topic: string
  slide_count: number
  language: string
  style: string
}
