import os
import re
import json
import io
import time
import uuid
import streamlit as st
from dotenv import load_dotenv
import google.generativeai as genai
from ppt_compiler import compile_presentation, THEMES

load_dotenv()

st.set_page_config(
    page_title="Snapdeck — Build a winning deck in a snap",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="expanded"
)

# ── CSS ──────────────────────────────────────────────────────────────────────
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

:root {
    --bg: #0D1117;
    --surface: #161B22;
    --elevated: #1C2128;
    --border: rgba(48, 54, 61, 0.85);
    --text: #E6EDF3;
    --text2: #8B949E;
    --text3: #6E7681;
    --accent: #7C3AED;
    --accent-l: #A78BFA;
    --accent-bg: rgba(124,58,237,0.1);
    --accent-glow: rgba(124,58,237,0.22);
    --green: #3FB950;
    --green-bg: rgba(63,185,80,0.1);
    --r-sm: 6px;
    --r-md: 10px;
    --r-lg: 16px;
    --t: 0.18s ease;
}

/* ── Base ── */
html, body,
[data-testid="stAppViewContainer"],
[data-testid="stMain"], section.main {
    background: var(--bg) !important;
    color: var(--text) !important;
}
.main .block-container {
    padding-top: 0 !important;
    padding-bottom: 4rem !important;
    max-width: 1120px !important;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
}
#MainMenu, footer, [data-testid="stHeader"] { display: none !important; }

/* ── Sidebar ── */
[data-testid="stSidebar"] {
    background: var(--surface) !important;
    border-right: 1px solid var(--border) !important;
}
[data-testid="stSidebar"] .stButton > button {
    background: var(--elevated) !important;
    color: var(--text2) !important;
    border: 1px solid var(--border) !important;
    box-shadow: none !important;
    transform: none !important;
}
[data-testid="stSidebar"] .stButton > button:hover {
    background: var(--accent-bg) !important;
    color: var(--accent-l) !important;
    border-color: var(--accent) !important;
    box-shadow: none !important;
    transform: none !important;
}

/* ── Inputs ── */
.stTextInput > div > div > input,
.stTextArea > div > textarea {
    background: var(--elevated) !important;
    color: var(--text) !important;
    border: 1px solid var(--border) !important;
    border-radius: var(--r-sm) !important;
    font-family: inherit !important;
    font-size: 0.93rem !important;
    line-height: 1.55 !important;
    transition: border-color var(--t), box-shadow var(--t) !important;
}
.stTextInput > div > div > input:focus,
.stTextArea > div > textarea:focus {
    border-color: var(--accent) !important;
    box-shadow: 0 0 0 3px var(--accent-glow) !important;
    outline: none !important;
}
.stTextInput > div > div > input::placeholder,
.stTextArea > div > textarea::placeholder { color: var(--text3) !important; }

.stSelectbox > div > div,
.stMultiSelect > div > div {
    background: var(--elevated) !important;
    color: var(--text) !important;
    border: 1px solid var(--border) !important;
    border-radius: var(--r-sm) !important;
}

/* ── Labels ── */
.stTextInput > label, .stTextArea > label,
.stSelectbox > label, .stRadio > label,
.stFileUploader > label, .stSlider > label,
.stNumberInput > label {
    color: var(--text2) !important;
    font-weight: 500 !important;
    font-size: 0.85rem !important;
    font-family: inherit !important;
    margin-bottom: 4px !important;
}
.stRadio > div > label, .stCheckbox > label {
    color: var(--text2) !important;
    font-size: 0.9rem !important;
}

/* ── Buttons ── */
.stButton > button {
    background: var(--accent) !important;
    color: #fff !important;
    border: none !important;
    border-radius: var(--r-sm) !important;
    font-weight: 600 !important;
    font-family: inherit !important;
    font-size: 0.88rem !important;
    padding: 0.55rem 1.1rem !important;
    transition: all var(--t) !important;
    letter-spacing: 0.01em !important;
}
.stButton > button:hover {
    background: #6D28D9 !important;
    transform: translateY(-1px) !important;
    box-shadow: 0 4px 14px var(--accent-glow) !important;
}
.stButton > button:active { transform: translateY(0) !important; }

.stDownloadButton > button {
    background: linear-gradient(135deg, var(--accent), #4F46E5) !important;
    color: #fff !important;
    border: none !important;
    border-radius: var(--r-sm) !important;
    font-weight: 700 !important;
    font-size: 1rem !important;
    padding: 0.75rem 1.5rem !important;
    box-shadow: 0 4px 18px var(--accent-glow) !important;
    transition: all var(--t) !important;
}
.stDownloadButton > button:hover {
    transform: translateY(-2px) !important;
    box-shadow: 0 8px 24px var(--accent-glow) !important;
}

/* ── Tabs ── */
.stTabs [data-baseweb="tab-list"] {
    background: var(--elevated) !important;
    border-radius: var(--r-sm) !important;
    gap: 2px !important;
    padding: 3px !important;
    border: 1px solid var(--border) !important;
}
.stTabs [data-baseweb="tab"] {
    background: transparent !important;
    color: var(--text2) !important;
    border-radius: 4px !important;
    font-family: inherit !important;
    font-size: 0.82rem !important;
    padding: 0.4rem 0.75rem !important;
}
.stTabs [aria-selected="true"] {
    background: var(--accent) !important;
    color: white !important;
}
.stTabs [data-baseweb="tab-panel"] {
    background: transparent !important;
    padding-top: 1.5rem !important;
}

/* ── Progress ── */
.stProgress > div > div {
    background: var(--accent) !important;
    border-radius: 100px !important;
}
.stProgress > div {
    background: var(--elevated) !important;
    border-radius: 100px !important;
    height: 6px !important;
}

/* ── Misc ── */
hr { border-color: var(--border) !important; margin: 1.5rem 0 !important; }
.stAlert { border-radius: var(--r-sm) !important; font-family: inherit !important; font-size: 0.9rem !important; }
.stMarkdown h1, .stMarkdown h2, .stMarkdown h3 { color: var(--text) !important; letter-spacing: -0.3px; }
.stMarkdown p { color: var(--text2) !important; line-height: 1.65 !important; }

/* ═══════════════════════════════════════
   Custom HTML Components
═══════════════════════════════════════ */

/* Navbar */
.navbar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 1rem 2rem;
    background: rgba(13,17,23,0.92);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border);
}
.nav-logo {
    font-weight: 800; font-size: 1.45rem;
    background: linear-gradient(135deg,#A78BFA,#7C3AED);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    letter-spacing: -0.5px;
}
.nav-links { display: flex; gap: 1.75rem; align-items: center; }
.nav-link { color: var(--text2); text-decoration: none; font-size: 0.88rem; font-weight: 500; transition: color var(--t); }
.nav-link:hover { color: var(--text); }

/* Hero */
.hero { text-align: center; padding: 5rem 1rem 3rem; max-width: 760px; margin: 0 auto; }
.hero-badge {
    display: inline-block; background: var(--accent-bg);
    border: 1px solid rgba(124,58,237,0.3); color: var(--accent-l);
    font-size: 0.72rem; font-weight: 700; padding: 0.28rem 0.9rem;
    border-radius: 100px; margin-bottom: 1.5rem;
    letter-spacing: 0.1em; text-transform: uppercase;
}
.hero-title {
    font-size: clamp(2.3rem, 4.2vw, 3.6rem);
    font-weight: 800; line-height: 1.15;
    margin-bottom: 1.2rem; color: var(--text);
    letter-spacing: -1.5px;
}
.hero-title .g {
    background: linear-gradient(135deg,#A78BFA 0%,#7C3AED 55%,#4F46E5 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
}
.hero-sub { font-size: 1.08rem; color: var(--text2); line-height: 1.75; margin-bottom: 2.5rem; }

/* Mockup Browser */
.mockup {
    max-width: 860px; margin: 3rem auto 5rem;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--r-lg); overflow: hidden;
    box-shadow: 0 28px 56px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.03);
}
.mockup-bar {
    display: flex; justify-content: space-between; align-items: center;
    padding: 0.65rem 1.2rem; background: var(--elevated); border-bottom: 1px solid var(--border);
}
.mdots { display:flex; gap:5px; }
.md { width:10px; height:10px; border-radius:50%; }
.md-r { background:#EF4444; } .md-y { background:#F59E0B; } .md-g { background:#10B981; }
.mfile { font-size:0.72rem; color:var(--text3); font-family:monospace; }
.msize { font-size:0.78rem; color:var(--accent-l); font-weight:600; }
.mockup-body { background:#0F172A; padding:2rem; }
.m-slide-hdr { border-left:4px solid #6366F1; padding-left:1rem; margin-bottom:1.25rem; }
.m-title { font-size:1.7rem; font-weight:800; color:white; margin-bottom:3px; }
.m-sub { font-size:0.82rem; color:#94A3B8; }
.m-cards { display:flex; gap:0.875rem; margin-bottom:1.25rem; }
.m-card { flex:1; background:#1E293B; border:1px solid #334155; border-radius:6px; padding:0.8rem; }
.m-ctitle { font-size:0.78rem; font-weight:700; color:#818CF8; margin-bottom:4px; }
.m-cdesc { font-size:0.72rem; color:#CBD5E1; line-height:1.45; }
.m-tw { background:rgba(30,27,75,0.7); border:1px solid #312E81; border-radius:6px; padding:0.55rem 0.875rem; font-size:0.78rem; color:#A5B4FC; }

/* Features */
.slabel { display:block; text-align:center; color:var(--accent-l); font-size:0.72rem; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; margin-bottom:0.6rem; }
.stitle { text-align:center; font-size:1.9rem; font-weight:800; color:var(--text); letter-spacing:-0.5px; margin-bottom:0.6rem; }
.ssub { text-align:center; font-size:0.98rem; color:var(--text2); line-height:1.65; max-width:580px; margin:0 auto 2.5rem; }
.feat-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(230px,1fr)); gap:1rem; margin-bottom:5rem; }
.feat { background:var(--surface); border:1px solid var(--border); border-radius:var(--r-md); padding:1.5rem; transition:all var(--t); }
.feat:hover { border-color:rgba(124,58,237,0.4); background:var(--elevated); transform:translateY(-2px); box-shadow:0 6px 20px rgba(124,58,237,0.08); }
.feat-icon { font-size:1.55rem; margin-bottom:0.7rem; display:block; }
.feat-title { font-size:0.98rem; font-weight:700; color:var(--text); margin-bottom:0.4rem; }
.feat-desc { font-size:0.85rem; color:var(--text2); line-height:1.6; }

/* Pricing */
.price-wrap { display:flex; gap:1.25rem; max-width:660px; margin:0 auto 5rem; }
.plan { flex:1; background:var(--surface); border:1px solid var(--border); border-radius:var(--r-lg); padding:1.75rem; }
.plan.pro { border-color:rgba(124,58,237,0.55); background:linear-gradient(135deg,rgba(124,58,237,0.07),rgba(79,70,229,0.04)); position:relative; }
.plan-badge { position:absolute; top:-11px; left:50%; transform:translateX(-50%); background:var(--accent); color:white; font-size:0.62rem; font-weight:700; padding:3px 12px; border-radius:100px; letter-spacing:0.06em; text-transform:uppercase; white-space:nowrap; }
.plan-name { font-size:0.95rem; font-weight:600; color:var(--text2); margin-bottom:0.4rem; }
.plan-price { font-size:2.4rem; font-weight:800; color:var(--text); line-height:1; margin-bottom:0.2rem; }
.plan-unit { font-size:0.85rem; font-weight:400; color:var(--text3); }
.plan-list { list-style:none; padding:0; margin:1.25rem 0 0; }
.plan-list li { font-size:0.85rem; color:var(--text2); padding:0.32rem 0; display:flex; gap:0.5rem; align-items:flex-start; border-bottom:1px solid var(--border); }
.plan-list li:last-child { border-bottom:none; }
.plan-list li::before { content:'✓'; color:var(--green); font-weight:700; flex-shrink:0; margin-top:1px; }

/* Auth */
.auth-box { max-width:390px; margin:3rem auto; background:var(--surface); border:1px solid var(--border); border-radius:var(--r-lg); padding:2.25rem; box-shadow:0 20px 40px rgba(0,0,0,0.35); }
.auth-title { text-align:center; font-size:1.55rem; font-weight:800; color:var(--text); margin-bottom:0.35rem; }
.auth-sub { text-align:center; font-size:0.86rem; color:var(--text2); margin-bottom:1.75rem; line-height:1.55; }
.divline { display:flex; align-items:center; gap:0.65rem; color:var(--text3); font-size:0.78rem; margin:0.9rem 0; }
.divline::before,.divline::after { content:''; flex:1; height:1px; background:var(--border); }

/* Wizard Progress Bar */
.wiz-bar { display:flex; align-items:center; padding:0.875rem 1.5rem; background:var(--surface); border:1px solid var(--border); border-radius:var(--r-md); margin-bottom:1.75rem; }
.w-step { display:flex; align-items:center; gap:0.45rem; flex-shrink:0; }
.w-num { width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:0.7rem; font-weight:700; border:2px solid var(--border); color:var(--text3); background:var(--bg); transition:all var(--t); }
.w-label { font-size:0.78rem; font-weight:500; color:var(--text3); white-space:nowrap; }
.w-step.active .w-num { background:var(--accent); border-color:var(--accent); color:white; }
.w-step.active .w-label { color:var(--text); font-weight:600; }
.w-step.done .w-num { background:var(--green-bg); border-color:var(--green); color:var(--green); }
.w-step.done .w-label { color:var(--green); }
.w-line { flex:1; height:1px; background:var(--border); margin:0 0.4rem; min-width:10px; }
.w-line.done { background:var(--green); }

/* Slide Edit Cards (Step 3) */
.s-card { background:var(--surface); border:1px solid var(--border); border-left:3px solid var(--accent); border-radius:var(--r-md); padding:1.4rem 1.5rem; margin-bottom:1.1rem; }
.s-card-hdr { display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; }
.s-badge { font-size:0.7rem; font-weight:700; color:var(--accent-l); text-transform:uppercase; letter-spacing:0.07em; }
.s-type { font-size:0.68rem; background:var(--accent-bg); color:var(--accent-l); border:1px solid rgba(124,58,237,0.2); padding:2px 7px; border-radius:4px; }

/* Canvas Preview (Step 5) */
.canvas { background:#0F172A; border:2px solid #334155; border-radius:var(--r-md); padding:2rem 2.25rem; position:relative; min-height:320px; }
.canvas-lbl { position:absolute; top:10px; right:12px; background:#1E293B; color:#818CF8; border:1px solid #334155; padding:3px 8px; border-radius:4px; font-size:0.68rem; font-family:monospace; }
.c-hdr { border-left:4px solid #6366F1; padding-left:1rem; margin:1.25rem 0; }
.c-t { font-size:1.65rem; font-weight:800; color:white; line-height:1.2; margin-bottom:0.3rem; }
.c-s { font-size:0.83rem; color:#94A3B8; font-style:italic; }
.c-tw { background:rgba(30,27,75,0.7); border:1px solid #312E81; border-radius:6px; padding:0.6rem 0.9rem; color:#A5B4FC; font-size:0.85rem; margin-top:0.875rem; }
.c-b { font-size:0.95rem; color:#E2E8F0; margin-bottom:9px; }
.c-col { flex:1; background:#1E293B; border:1px solid #334155; border-radius:6px; padding:0.8rem; }
.c-col-lbl { font-size:0.72rem; font-weight:700; color:#818CF8; margin-bottom:5px; }

/* Slide Miniature (Step 4) */
.mini { background:white; border:1px solid #E2E8F0; border-radius:6px; padding:10px; min-height:120px; transition:border-color var(--t); box-shadow:0 1px 3px rgba(0,0,0,0.06); }
.mini:hover { border-color:#A78BFA; }
.mini-n { font-size:0.62rem; font-weight:700; color:#6E7681; font-family:monospace; margin-bottom:3px; }
.mini-t { font-size:0.78rem; font-weight:700; color:#1E293B; line-height:1.3; margin-bottom:3px; }
.mini-tp { font-size:0.62rem; color:#7C3AED; margin-bottom:5px; }
.mini-bar { width:22px; height:2px; background:#7C3AED; margin-bottom:5px; }
.mini-kw { font-size:0.6rem; color:#4F46E5; font-style:italic; line-height:1.4; }

/* Info tag */
.tag-info { display:inline-block; background:rgba(88,166,255,0.08); border:1px solid rgba(88,166,255,0.2); color:#58A6FF; font-size:0.82rem; padding:0.4rem 0.8rem; border-radius:var(--r-sm); margin-bottom:1rem; }
</style>
""", unsafe_allow_html=True)

# ── Session State ─────────────────────────────────────────────────────────────
_DEFAULTS = {
    'view': 'landing',
    'step': 1,
    'topic': '',
    'source_text': '',
    'lang': '한국어',
    'category': 'Startup Pitch (투자 유치 및 IR 덱)',
    'deck_format': 'Standard (16:9)',
    'theme': 'Nordic Tech (Ice White & Indigo)',
    'presentation_data': None,
    'slide_count': 7,
    'generation_progress': False,
    'compiled_pptx': None,
    'gemini_api_key': '',
}
for _k, _v in _DEFAULTS.items():
    if _k not in st.session_state:
        st.session_state[_k] = _v

# ── API ───────────────────────────────────────────────────────────────────────
def initialize_gemini():
    key = os.getenv("GEMINI_API_KEY") or st.session_state.get('gemini_api_key', '')
    if key:
        genai.configure(api_key=key)
    return key

api_key = initialize_gemini()


def ask_gemini_for_presentation(topic, lang, category, slide_count, source_text=''):
    if not initialize_gemini():
        st.error("Gemini API Key가 필요합니다.")
        return None
    model = genai.GenerativeModel("gemini-1.5-flash")
    src = f"\n\n[참고 자료 (요약해서 활용하세요)]\n{source_text[:3500]}" if source_text.strip() else ''
    prompt = f"""
주제: "{topic}"
언어: {lang}
발표 목적: {category}
슬라이드 수: {slide_count}장
{src}

위 정보를 바탕으로 {slide_count}장 분량의 고품질 발표 슬라이드를 {lang}로 기획해주세요.

사용 가능한 슬라이드 타입:
- title_and_content : 핵심 불렛 슬라이드 (bullets 3~4개)
- section_header    : 섹션 전환 슬라이드
- big_stat          : 수치/지표 강조 슬라이드
- two_column        : 비교/대조 슬라이드
- three_cards       : 3개 카드 슬라이드
- timeline          : 로드맵/단계 슬라이드 (4단계)
- team_grid         : 팀 소개 슬라이드

엄격히 지킬 규칙:
1. 모든 텍스트는 {lang}로 작성
2. big_stat  → stat_value (예: "85%"), stat_description 필수 포함
3. three_cards → cards 배열에 card_title, card_content 3개 필수
4. timeline   → timeline_steps 배열에 step_title, step_desc 4개 필수
5. team_grid  → team_members 배열에 name, role, bio 필수
6. bullets    → 3~4개, 간결한 발표용 문장
7. key_takeaway → 슬라이드 핵심 인사이트 1문장
8. speaker_notes → 발표자용 스크립트 2~3문장 (청중에게 말할 내용)

순수 JSON만 반환 (```코드블록 없이):
{{
  "presentation_title": "...",
  "presentation_subtitle": "...",
  "slides": [
    {{
      "slide_index": 1,
      "slide_type": "title_and_content",
      "title": "...",
      "summary": "1문장 요약",
      "bullets": ["..."],
      "key_takeaway": "...",
      "speaker_notes": "발표자 스크립트..."
    }}
  ]
}}
"""
    cfg = {"response_mime_type": "application/json", "temperature": 0.75}
    try:
        resp = model.generate_content(prompt, generation_config=cfg)
        text = resp.text.strip()
        text = re.sub(r'^```(?:json)?\n?', '', text)
        text = re.sub(r'\n?```$', '', text)
        data = json.loads(text)
        # Assign unique IDs to each slide for stable widget keys
        for s in data.get('slides', []):
            s['_id'] = uuid.uuid4().hex[:8]
        return data
    except Exception as e:
        st.error(f"AI 생성 오류: {e}")
        return None


def magic_edit_slide(slide, instruction, lang):
    if not initialize_gemini():
        return None
    model = genai.GenerativeModel("gemini-1.5-flash")
    prompt = f"""
현재 슬라이드 데이터:
{json.dumps(slide, ensure_ascii=False, indent=2)}

수정 지시사항: {instruction}
언어: {lang}

지시사항에 맞게 슬라이드를 수정하여 동일한 JSON 구조로 반환하세요.
slide_type, slide_index, _id 는 변경하지 마세요.
순수 JSON만 반환 (코드블록 없이).
"""
    cfg = {"response_mime_type": "application/json", "temperature": 0.5}
    try:
        resp = model.generate_content(prompt, generation_config=cfg)
        text = resp.text.strip()
        text = re.sub(r'^```(?:json)?\n?', '', text)
        text = re.sub(r'\n?```$', '', text)
        return json.loads(text)
    except Exception as e:
        st.error(f"Magic Edit 오류: {e}")
        return None


def trigger_pptx_recompile():
    data = st.session_state.get('presentation_data')
    if data:
        buf = io.BytesIO()
        compile_presentation(
            data, buf,
            theme_name=st.session_state.get('theme'),
            deck_format=st.session_state.get('deck_format', 'Standard (16:9)')
        )
        buf.seek(0)
        st.session_state['compiled_pptx'] = buf.read()


def render_progress_header():
    step = st.session_state.get('step', 1)
    steps = [(1,"프롬프트"), (2,"스타일"), (3,"아웃라인"), (4,"슬라이드 빌드"), (5,"편집 & 수출")]
    parts = []
    for i, (n, label) in enumerate(steps):
        cls = "done" if n < step else ("active" if n == step else "")
        icon = "✓" if n < step else str(n)
        parts.append(f'<div class="w-step {cls}"><span class="w-num">{icon}</span><span class="w-label">{label}</span></div>')
        if i < len(steps) - 1:
            lc = "done" if n < step else ""
            parts.append(f'<div class="w-line {lc}"></div>')
    st.markdown(f'<div class="wiz-bar">{"".join(parts)}</div>', unsafe_allow_html=True)


def render_navbar():
    c1, c2 = st.columns([1, 2])
    with c1:
        st.markdown('<span class="nav-logo">⚡ snapdeck</span>', unsafe_allow_html=True)
    with c2:
        st.markdown('''
        <div class="nav-links" style="justify-content:flex-end;">
            <a href="#" class="nav-link">기능</a>
            <a href="#" class="nav-link">요금제</a>
            <a href="#" class="nav-link">블로그</a>
        </div>''', unsafe_allow_html=True)


def _slide_form_key(slide, suffix):
    return f"{suffix}_{slide.get('_id', slide.get('slide_index', '0'))}"


# ════════════════════════════════════════════════════════════════
#  VIEW 1 · LANDING
# ════════════════════════════════════════════════════════════════
if st.session_state['view'] == 'landing':
    render_navbar()

    st.markdown("""
    <div class="hero">
        <div class="hero-badge">✨ AI-Powered Presentation Builder</div>
        <div class="hero-title">Build a winning deck<br><span class="g">in a snap.</span></div>
        <div class="hero-sub">주제를 입력하면 AI가 즉시 슬라이드를 기획하고<br>완성된 PPTX 파일까지 자동으로 생성해드립니다.</div>
    </div>
    """, unsafe_allow_html=True)

    c1, c2, c3 = st.columns([3, 2, 3])
    with c2:
        if st.button("무료로 시작하기  →", use_container_width=True, key="hero_cta"):
            st.session_state['view'] = 'signup'
            st.rerun()

    st.markdown("""
    <div class="mockup">
        <div class="mockup-bar">
            <div class="mdots"><div class="md md-r"></div><div class="md md-y"></div><div class="md md-g"></div></div>
            <div class="mfile">snapdeck_editor.json</div>
            <div class="msize">1920 × 1080</div>
        </div>
        <div class="mockup-body">
            <div class="m-slide-hdr">
                <div class="m-title">AI 진단 보조 솔루션 — 투자 유치 덱</div>
                <div class="m-sub">의료 효율성 극대화와 환자 안전을 위한 AI 혁신</div>
            </div>
            <div class="m-cards">
                <div class="m-card"><div class="m-ctitle">EHR 직접 연동 API</div><div class="m-cdesc">기존 병원 시스템에 API 기반으로 긴밀하게 연동됩니다.</div></div>
                <div class="m-card"><div class="m-ctitle">48시간 내 도입 완료</div><div class="m-cdesc">복잡한 인프라 개편 없이 현업 배치 가능합니다.</div></div>
                <div class="m-card"><div class="m-ctitle">진단 정확도 94.7%</div><div class="m-cdesc">임상 검증을 통해 높은 정확도를 달성했습니다.</div></div>
            </div>
            <div class="m-tw">💡 Key Takeaway: 환자 안전을 보장하는 최적의 AI 어시스턴트</div>
        </div>
    </div>
    """, unsafe_allow_html=True)

    st.markdown("""
    <div class="slabel">핵심 기능</div>
    <div class="stitle">왜 Snapdeck인가요?</div>
    <div class="ssub">단순한 슬라이드 생성을 넘어, 기획부터 디자인까지 발표의 전 과정을 AI가 지원합니다.</div>
    <div class="feat-grid">
        <div class="feat"><span class="feat-icon">📝</span><div class="feat-title">AI 아웃라인 생성</div><div class="feat-desc">주제를 입력하면 슬라이드 구조, 흐름, 핵심 메시지를 AI가 즉시 기획합니다.</div></div>
        <div class="feat"><span class="feat-icon">✨</span><div class="feat-title">Magic Edit</div><div class="feat-desc">자연어로 명령하면 슬라이드 내용을 즉시 개선 · 단축 · 톤 조정합니다.</div></div>
        <div class="feat"><span class="feat-icon">📐</span><div class="feat-title">다이나믹 레이아웃</div><div class="feat-desc">카드 · 타임라인 · 통계 · 팀 그리드 등 내용에 맞는 레이아웃을 자동 배치합니다.</div></div>
        <div class="feat"><span class="feat-icon">📥</span><div class="feat-title">PPTX 내보내기</div><div class="feat-desc">PowerPoint에서 바로 편집 가능한 완전한 .pptx 파일로 다운로드합니다.</div></div>
        <div class="feat"><span class="feat-icon">🗒️</span><div class="feat-title">발표자 스크립트</div><div class="feat-desc">AI가 각 슬라이드별 발표자 노트를 자동으로 작성해드립니다.</div></div>
        <div class="feat"><span class="feat-icon">🌐</span><div class="feat-title">20개 언어 지원</div><div class="feat-desc">한국어 · 영어 · 일본어 등 20개 언어로 발표 자료를 즉시 생성합니다.</div></div>
    </div>
    """, unsafe_allow_html=True)

    st.markdown("""
    <div class="slabel">요금제</div>
    <div class="stitle">심플한 가격 정책</div>
    <div class="ssub">숨겨진 비용 없이, 필요한 만큼만 사용하세요.</div>
    <div class="price-wrap">
        <div class="plan">
            <div class="plan-name">Free</div>
            <div class="plan-price">$0</div>
            <ul class="plan-list">
                <li>AI 슬라이드 기본 생성</li>
                <li>기본 레이아웃 4종</li>
                <li>PPTX 내보내기 (워터마크)</li>
                <li>월 5회 생성 제한</li>
            </ul>
        </div>
        <div class="plan pro">
            <div class="plan-badge">추천</div>
            <div class="plan-name">Pro</div>
            <div class="plan-price">$15 <span class="plan-unit">/ 월</span></div>
            <ul class="plan-list">
                <li>무제한 AI 슬라이드 생성</li>
                <li>모든 레이아웃 · 테마</li>
                <li>워터마크 없는 PPTX</li>
                <li>실시간 Magic Edit</li>
                <li>발표자 스크립트 자동 생성</li>
                <li>브랜드 키트 (로고 · 색상)</li>
            </ul>
        </div>
    </div>
    """, unsafe_allow_html=True)

    cp1, cp2, cp3, cp4 = st.columns([2, 2, 2, 2])
    with cp2:
        if st.button("무료로 시작", key="cta_free", use_container_width=True):
            st.session_state['view'] = 'signup'; st.rerun()
    with cp3:
        if st.button("Pro 업그레이드", key="cta_pro", use_container_width=True):
            st.session_state['view'] = 'signup'; st.rerun()


# ════════════════════════════════════════════════════════════════
#  VIEW 2 · SIGNUP
# ════════════════════════════════════════════════════════════════
elif st.session_state['view'] == 'signup':
    render_navbar()
    st.markdown("""
    <div class="auth-box">
        <div class="auth-title">계정 만들기</div>
        <div class="auth-sub">무료로 시작하고, 언제든 Pro로 업그레이드하세요.</div>
    </div>
    """, unsafe_allow_html=True)

    sa1, sa2, sa3 = st.columns([3, 4, 3])
    with sa2:
        if st.button("🔴  Google 계정으로 계속하기", key="btn_g", use_container_width=True):
            st.session_state['view'] = 'onboarding'; st.rerun()
        if st.button("💛  카카오 계정으로 계속하기", key="btn_k", use_container_width=True):
            st.session_state['view'] = 'onboarding'; st.rerun()
        if st.button("🍎  Apple 계정으로 계속하기", key="btn_a", use_container_width=True):
            st.session_state['view'] = 'onboarding'; st.rerun()

        st.markdown('<div class="divline">또는 이메일로 가입</div>', unsafe_allow_html=True)
        email = st.text_input("이메일 주소", placeholder="name@company.com")
        pw = st.text_input("비밀번호", type="password")
        st.write("")
        if st.button("회원가입", key="btn_email", use_container_width=True):
            if email and pw:
                st.session_state['view'] = 'onboarding'; st.rerun()
            else:
                st.warning("이메일과 비밀번호를 입력해 주세요.")
        st.markdown("<div style='text-align:center;margin-top:1rem;'><a href='#' style='color:#A78BFA;font-size:0.82rem;text-decoration:none;'>이미 계정이 있으신가요? 로그인</a></div>", unsafe_allow_html=True)


# ════════════════════════════════════════════════════════════════
#  VIEW 3 · ONBOARDING
# ════════════════════════════════════════════════════════════════
elif st.session_state['view'] == 'onboarding':
    render_navbar()
    st.markdown("## Snapdeck 온보딩")
    st.markdown("작업 방식을 알려주시면 최적의 템플릿과 스타일을 제안해 드립니다.")
    st.divider()

    ob1, ob2, ob3 = st.columns([1, 4, 1])
    with ob2:
        st.markdown("#### 주로 어떤 언어로 작업하시나요?")
        st.caption("선택한 언어를 기준으로 슬라이드를 기획합니다.")
        langs_all = ["한국어","English","日本語","中文 (简体)","中文 (繁體)",
                     "Español","Français","Deutsch","Português","Italiano",
                     "Русский","العربية","हिंदी","Nederlands","Polski",
                     "Türkçe","Tiếng Việt","ภาษาไทย","Bahasa","Svenska"]
        lc = st.columns(4)
        sel_lang = "한국어"
        for idx, lg in enumerate(langs_all):
            with lc[idx % 4]:
                if st.checkbox(lg, value=(lg == "한국어"), key=f"ob_l_{lg}"):
                    sel_lang = lg

        st.write("")
        st.markdown("#### 어떤 유형의 발표를 주로 만드시나요?")
        cats = [
            "Startup Pitch (투자 유치 및 IR 덱)",
            "Business Report (전략 · 분석 · 인사이트)",
            "Academic (연구 및 학습 발표)",
            "Sales Deck (제안서 및 세일즈 덱)",
            "Other (그 외 목적)",
        ]
        sel_cats = []
        for cat in cats:
            if st.checkbox(cat, value=(cat == cats[0]), key=f"ob_c_{cat}"):
                sel_cats.append(cat)

        st.session_state['lang'] = sel_lang
        if sel_cats:
            st.session_state['category'] = sel_cats[0]

        st.write("")
        if st.button("서비스 시작하기  →", key="ob_submit", use_container_width=True):
            st.session_state['view'] = 'generator'; st.rerun()


# ════════════════════════════════════════════════════════════════
#  VIEW 4 · GENERATOR
# ════════════════════════════════════════════════════════════════
elif st.session_state['view'] == 'generator':

    # Sidebar
    with st.sidebar:
        st.markdown("### ⚡ snapdeck")
        st.divider()
        if not api_key:
            st.warning("API Key가 설정되지 않았습니다.")
            entered = st.text_input("Gemini API Key", type="password", key="key_input")
            if entered:
                st.session_state['gemini_api_key'] = entered
                with open(".env", "w", encoding="utf-8") as f:
                    f.write(f"GEMINI_API_KEY={entered}\n")
                st.success("저장 완료!")
                st.rerun()
        else:
            st.success("API Key 연결됨")
            if st.button("API Key 변경"):
                st.session_state['gemini_api_key'] = ''
                if os.path.exists(".env"):
                    os.remove(".env")
                st.rerun()
        st.divider()
        if st.button("← 메인으로 돌아가기"):
            st.session_state['view'] = 'landing'
            st.session_state['step'] = 1
            st.rerun()

    render_progress_header()

    # ─── STEP 1: 프롬프트 입력 ───────────────────────────────────────
    if st.session_state['step'] == 1:
        st.markdown("### 📝 발표 주제 및 정보 입력")
        st.markdown("만들고 싶은 발표 자료를 자세히 설명할수록 더 완성도 높은 슬라이드가 생성됩니다.")
        st.divider()

        topic = st.text_area(
            "발표 주제 및 핵심 기획 아이디어",
            value=st.session_state['topic'],
            placeholder="예: 헬스케어 비효율 해소를 위한 AI 진단 솔루션 투자 유치 자료. 문제점, 솔루션 특징, ARR 실적, 팀 구성, 자금 조달 계획 포함.",
            height=110,
        )

        c_l, c_r = st.columns(2)
        with c_l:
            slide_count = st.slider(
                "슬라이드 수",
                min_value=3, max_value=20,
                value=st.session_state['slide_count'],
                help="총 생성할 슬라이드 장 수 (타이틀 슬라이드 포함)"
            )
        with c_r:
            langs_list = ["한국어","English","日本語","中文 (简体)","中文 (繁體)",
                          "Español","Français","Deutsch","Português","Italiano",
                          "Русский","العربية","हिंदी","Nederlands","Polski",
                          "Türkçe","Tiếng Việt","ภาษาไทย","Bahasa","Svenska"]
            lang = st.selectbox("언어", langs_list,
                                index=langs_list.index(st.session_state['lang']))

        cats_list = [
            "Startup Pitch (투자 유치 및 IR 덱)",
            "Business Report (전략 · 분석 · 인사이트)",
            "Academic (연구 및 학습 발표)",
            "Sales Deck (제안서 및 세일즈 덱)",
            "Other (그 외 목적)",
        ]
        category = st.selectbox("발표 목적", cats_list,
                                index=cats_list.index(st.session_state['category']))

        st.divider()
        st.markdown("#### 참고 자료 추가 (선택)")
        st.caption("기획서, 보고서, 원본 텍스트 등을 제공하면 AI가 내용을 분석해 슬라이드에 반영합니다.")
        fu1, fu2 = st.columns(2)
        with fu1:
            up = st.file_uploader("파일 업로드 (.txt, .md)", type=["txt","md"])
            if up:
                try:
                    st.session_state['source_text'] = up.read().decode("utf-8")
                    st.success("파일 로드 완료")
                except Exception as e:
                    st.error(f"파일 오류: {e}")
        with fu2:
            paste = st.text_area(
                "또는 텍스트 직접 붙여넣기",
                value=st.session_state['source_text'],
                placeholder="노션, 메일, PDF 등에서 복사한 내용을 여기에 붙여넣으세요...",
                height=130,
            )
            st.session_state['source_text'] = paste

        st.write("")
        if st.button("다음 단계 — 스타일 선택  →", use_container_width=False):
            if not topic.strip():
                st.warning("발표 주제를 먼저 입력해 주세요.")
            else:
                st.session_state['topic'] = topic
                st.session_state['slide_count'] = slide_count
                st.session_state['lang'] = lang
                st.session_state['category'] = category
                st.session_state['step'] = 2
                st.rerun()

    # ─── STEP 2: 스타일 & 테마 ───────────────────────────────────────
    elif st.session_state['step'] == 2:
        st.markdown("### 🎨 스타일 및 디자인 테마 선택")
        st.markdown("선택한 테마와 비율이 전체 슬라이드에 일관되게 적용됩니다.")
        st.divider()

        sf1, sf2 = st.columns(2)
        with sf1:
            fmts = [
                "Standard (16:9)",
                "Social Carousel (4:5)",
                "Keynote Widescreen (16:10)",
                "Report / Document (A4-Horizontal)",
                "Classic Slide (4:3)",
            ]
            deck_format = st.radio("덱 비율 형식", fmts,
                                   index=fmts.index(st.session_state['deck_format']))
        with sf2:
            theme_keys = list(THEMES.keys())
            selected_theme = st.selectbox("색상 테마",
                                          theme_keys,
                                          index=theme_keys.index(st.session_state['theme']))
            st.write("")
            st.markdown('<div class="tag-info">선택한 테마 팔레트 프리뷰</div>', unsafe_allow_html=True)
            colors = THEMES[selected_theme]
            acc_hex = "#{:02X}{:02X}{:02X}".format(*colors["accent"])
            bg_hex  = "#{:02X}{:02X}{:02X}".format(*colors["bg_light"])
            pt_hex  = "#{:02X}{:02X}{:02X}".format(*colors["primary_text"])
            st.markdown(f"""
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px;">
                <div style="width:36px;height:36px;border-radius:6px;background:{bg_hex};border:1px solid var(--border);"></div>
                <div style="width:36px;height:36px;border-radius:6px;background:{acc_hex};"></div>
                <div style="width:36px;height:36px;border-radius:6px;background:{pt_hex};"></div>
                <div style="line-height:36px;font-size:0.82rem;color:var(--text2);margin-left:4px;">배경 · 강조 · 텍스트</div>
            </div>
            """, unsafe_allow_html=True)

        st.session_state['deck_format'] = deck_format
        st.session_state['theme'] = selected_theme

        st.write("")
        n1, n2, _ = st.columns([1.2, 1.2, 8])
        with n1:
            if st.button("← 이전"):
                st.session_state['step'] = 1; st.rerun()
        with n2:
            if st.button("다음 →"):
                st.session_state['step'] = 3; st.rerun()

    # ─── STEP 3: 아웃라인 검토 & 편집 ───────────────────────────────
    elif st.session_state['step'] == 3:
        st.markdown("### 📋 AI 아웃라인 검토 및 편집")
        st.markdown("슬라이드 목차를 수정하고 순서를 조정한 뒤, 다음 단계에서 최종 컴파일합니다.")

        data = st.session_state['presentation_data']

        # Generate if not yet generated
        if data is None:
            with st.spinner("AI가 슬라이드 기획안을 작성하는 중입니다..."):
                data = ask_gemini_for_presentation(
                    st.session_state['topic'],
                    st.session_state['lang'],
                    st.session_state['category'],
                    st.session_state['slide_count'],
                    st.session_state['source_text'],
                )
            if data:
                st.session_state['presentation_data'] = data
                st.success("기획안 작성 완료! 아래에서 내용을 확인 · 수정하세요.")
            else:
                st.error("기획안을 생성하지 못했습니다. 이전 단계로 돌아가 주제를 다시 확인해 주세요.")
                if st.button("← 1단계로"):
                    st.session_state['step'] = 1; st.rerun()
                st.stop()

        # Toolbar: title + regenerate + add slide
        st.divider()
        th1, th2 = st.columns([3, 1])
        with th1:
            data["presentation_title"]    = st.text_input("프레젠테이션 제목", value=data.get("presentation_title",""))
            data["presentation_subtitle"] = st.text_input("부제목 / 회사명",   value=data.get("presentation_subtitle",""))
        with th2:
            st.write("")
            st.write("")
            st.write("")
            if st.button("🔄  아웃라인 재생성", use_container_width=True):
                st.session_state['presentation_data'] = None
                st.rerun()
            if st.button("➕  슬라이드 추가",   use_container_width=True):
                blank = {
                    "_id": uuid.uuid4().hex[:8],
                    "slide_index": len(data['slides']) + 1,
                    "slide_type": "title_and_content",
                    "title": "새 슬라이드",
                    "summary": "",
                    "bullets": ["내용을 입력하세요"],
                    "key_takeaway": "",
                    "speaker_notes": "",
                }
                data['slides'].append(blank)
                st.session_state['presentation_data'] = data
                st.rerun()

        st.divider()

        slides = data.get('slides', [])
        updated_slides = []

        SLIDE_TYPES = ["title_and_content","section_header","big_stat",
                       "two_column","three_cards","timeline","team_grid"]

        for i, slide in enumerate(slides):
            sid = slide.get('_id', str(i))

            # Slide card header with reorder / delete buttons
            hc1, hc2, hc_up, hc_dn, hc_del = st.columns([6, 3, 0.6, 0.6, 0.6])
            with hc1:
                st.markdown(f'<div class="s-badge">Slide {i+1} / {len(slides)}</div>', unsafe_allow_html=True)
            with hc2:
                st.markdown(f'<div class="s-type" style="margin-top:4px">{slide.get("slide_type","")}</div>', unsafe_allow_html=True)
            with hc_up:
                if st.button("↑", key=f"up_{sid}", help="위로 이동") and i > 0:
                    slides[i], slides[i-1] = slides[i-1], slides[i]
                    for idx2, s2 in enumerate(slides): s2['slide_index'] = idx2 + 1
                    data['slides'] = slides
                    st.session_state['presentation_data'] = data
                    st.rerun()
            with hc_dn:
                if st.button("↓", key=f"dn_{sid}", help="아래로 이동") and i < len(slides)-1:
                    slides[i], slides[i+1] = slides[i+1], slides[i]
                    for idx2, s2 in enumerate(slides): s2['slide_index'] = idx2 + 1
                    data['slides'] = slides
                    st.session_state['presentation_data'] = data
                    st.rerun()
            with hc_del:
                if st.button("✕", key=f"del_{sid}", help="슬라이드 삭제"):
                    slides.pop(i)
                    for idx2, s2 in enumerate(slides): s2['slide_index'] = idx2 + 1
                    data['slides'] = slides
                    st.session_state['presentation_data'] = data
                    st.rerun()

            with st.container():
                st.markdown(f'<div class="s-card">', unsafe_allow_html=True)
                cc1, cc2 = st.columns(2)
                with cc1:
                    slide_title   = st.text_input(f"제목",   value=slide.get("title",""),   key=f"tit_{sid}")
                    slide_summary = st.text_input(f"요약",   value=slide.get("summary",""), key=f"sum_{sid}")
                    slide_type    = st.selectbox(f"레이아웃 타입", SLIDE_TYPES,
                                                 index=SLIDE_TYPES.index(slide.get("slide_type","title_and_content")),
                                                 key=f"typ_{sid}")
                    stat_value = stat_desc = ""
                    cards_payload = timeline_payload = team_payload = []

                    if slide_type == "big_stat":
                        sv1, sv2 = st.columns(2)
                        with sv1:
                            stat_value = st.text_input("수치 (Value)", value=slide.get("stat_value","100%"), key=f"sv_{sid}")
                        with sv2:
                            stat_desc  = st.text_input("설명 (Desc)",  value=slide.get("stat_description","주요 지표"), key=f"sd_{sid}")

                    if slide_type == "three_cards":
                        cards = slide.get("cards", [])
                        if len(cards) < 3:
                            cards = [{"card_title":f"카드 {k+1}","card_content":f"내용 {k+1}"} for k in range(3)]
                        cards_payload = []
                        for k in range(3):
                            ck1, ck2 = st.columns([1,2])
                            with ck1: ct = st.text_input(f"카드 {k+1} 제목", value=cards[k].get("card_title",""), key=f"ct_{sid}_{k}")
                            with ck2: cc = st.text_input(f"카드 {k+1} 내용", value=cards[k].get("card_content",""), key=f"cc_{sid}_{k}")
                            cards_payload.append({"card_title":ct,"card_content":cc})

                    if slide_type == "timeline":
                        steps = slide.get("timeline_steps",[])
                        if len(steps) < 4:
                            steps = [{"step_title":f"Phase {k+1}","step_desc":f"설명 {k+1}"} for k in range(4)]
                        timeline_payload = []
                        for k in range(4):
                            sk1, sk2 = st.columns([1,2])
                            with sk1: st_t = st.text_input(f"단계 {k+1}", value=steps[k].get("step_title",""), key=f"st_{sid}_{k}")
                            with sk2: st_d = st.text_input(f"설명 {k+1}", value=steps[k].get("step_desc",""),  key=f"sd2_{sid}_{k}")
                            timeline_payload.append({"step_title":st_t,"step_desc":st_d})

                    if slide_type == "team_grid":
                        members = slide.get("team_members",[])
                        if len(members) < 2:
                            members = [{"name":f"Member {k+1}","role":"Role","bio":"Bio"} for k in range(2)]
                        team_payload = []
                        for k in range(min(len(members),3)):
                            mk1,mk2,mk3 = st.columns([1,1,2])
                            with mk1: mn = st.text_input(f"이름 {k+1}",  value=members[k].get("name",""), key=f"mn_{sid}_{k}")
                            with mk2: mr = st.text_input(f"직책 {k+1}",  value=members[k].get("role",""), key=f"mr_{sid}_{k}")
                            with mk3: mb = st.text_input(f"약력 {k+1}",  value=members[k].get("bio",""),  key=f"mb_{sid}_{k}")
                            team_payload.append({"name":mn,"role":mr,"bio":mb})

                with cc2:
                    bullets_text = "\n".join(slide.get("bullets",[]))
                    raw_bullets  = st.text_area("불렛 포인트 (줄바꿈으로 구분)", value=bullets_text, height=120, key=f"bul_{sid}")
                    parsed_bullets = [l.strip() for l in raw_bullets.split("\n") if l.strip()]

                    takeaway = st.text_input("💡 Key Takeaway", value=slide.get("key_takeaway",""), key=f"tw_{sid}")
                    notes    = st.text_area("🗒️ 발표자 스크립트", value=slide.get("speaker_notes",""), height=80, key=f"nt_{sid}")

                st.markdown('</div>', unsafe_allow_html=True)

            updated = {
                "_id": sid,
                "slide_index": i + 1,
                "slide_type": slide_type,
                "title": slide_title,
                "summary": slide_summary,
                "bullets": parsed_bullets,
                "key_takeaway": takeaway,
                "speaker_notes": notes,
            }
            if slide_type == "big_stat":
                updated["stat_value"] = stat_value
                updated["stat_description"] = stat_desc
            elif slide_type == "three_cards":
                updated["cards"] = cards_payload
            elif slide_type == "timeline":
                updated["timeline_steps"] = timeline_payload
            elif slide_type == "team_grid":
                updated["team_members"] = team_payload
            updated_slides.append(updated)

        data["slides"] = updated_slides
        st.session_state['presentation_data'] = data
        st.divider()

        n1, n2, _ = st.columns([1.3, 1.6, 8])
        with n1:
            if st.button("← 스타일"):
                st.session_state['step'] = 2; st.rerun()
        with n2:
            if st.button("슬라이드 빌드  →"):
                st.session_state['step'] = 4
                st.session_state['generation_progress'] = True
                st.rerun()

    # ─── STEP 4: 실시간 빌드 ────────────────────────────────────────
    elif st.session_state['step'] == 4:
        st.markdown("### ⚡ 슬라이드 컴파일")
        st.markdown("아웃라인과 테마를 결합하여 PowerPoint 파일을 생성하는 단계입니다.")
        st.divider()

        prog = st.empty()
        status = st.empty()

        if st.session_state.get('generation_progress', False):
            st.session_state['generation_progress'] = False
            n_slides = len(st.session_state['presentation_data'].get('slides', []))
            for i in range(101):
                prog.progress(i)
                if i < 25:
                    status.info("⚙️  디자인 토큰 로드 및 레이아웃 설정 중...")
                elif i < 55:
                    cur = min(int((i - 25) / (30 / max(n_slides,1))) + 1, n_slides)
                    status.info(f"🎨  테마 색상 매핑 중... ({cur}/{n_slides})")
                elif i < 85:
                    status.warning("✍️  텍스트 조판 및 불렛 배치 중...")
                else:
                    status.success("💡  PPTX 파일 컴파일 완료!")
                time.sleep(0.018)
            trigger_pptx_recompile()

        st.success("🎉 모든 슬라이드가 성공적으로 컴파일되었습니다!")
        st.write("")

        data = st.session_state['presentation_data']
        slides = data.get('slides', [])
        st.markdown("#### 슬라이드 미리보기")
        cols = st.columns(min(len(slides), 4))
        for idx, sl in enumerate(slides):
            with cols[idx % len(cols)]:
                kw = sl.get('key_takeaway','')
                kw_short = kw[:30] + "..." if len(kw) > 30 else kw
                st.markdown(f"""
                <div class="mini">
                    <div class="mini-n">SLIDE {idx+1}</div>
                    <div class="mini-t">{sl.get('title','')}</div>
                    <div class="mini-tp">{sl.get('slide_type','')}</div>
                    <div class="mini-bar"></div>
                    <div class="mini-kw">💡 {kw_short}</div>
                </div>""", unsafe_allow_html=True)

        st.write("")
        n1, n2, _ = st.columns([1.2, 1.8, 8])
        with n1:
            if st.button("← 아웃라인"):
                st.session_state['step'] = 3; st.rerun()
        with n2:
            if st.button("편집 & 수출  →"):
                st.session_state['step'] = 5; st.rerun()

    # ─── STEP 5: Canvas Editor & 수출 ───────────────────────────────
    elif st.session_state['step'] == 5:
        st.markdown("### 🖥️  Canvas 편집 & 최종 수출")
        st.markdown(f"현재 형식: **{st.session_state['deck_format']}** · 테마: **{st.session_state['theme']}**")
        st.divider()

        data   = st.session_state['presentation_data']
        slides = data.get('slides', [])
        is_v   = st.session_state['deck_format'] == "Social Carousel (4:5)"
        mock_style = "max-width:420px;margin:0 auto;" if is_v else "width:100%;"

        tabs = st.tabs([f"Slide {s.get('slide_index',i+1)}: {s.get('title','')[:12]}"
                        for i, s in enumerate(slides)])

        for i, slide in enumerate(slides):
            with tabs[i]:
                stype   = slide.get('slide_type','title_and_content')
                bullets = slide.get('bullets',[])

                # Build layout HTML
                if stype == "two_column":
                    half = len(bullets)//2
                    l_b  = bullets[:half] if half > 0 else bullets
                    r_b  = bullets[half:] if half > 0 else []
                    fd   = "flex-direction:column;" if is_v else ""
                    l_html = "".join([f'<div class="c-b">• {b}</div>' for b in l_b])
                    r_html = "".join([f'<div class="c-b">• {b}</div>' for b in r_b])
                    layout = f'<div style="display:flex;gap:16px;margin-bottom:1.25rem;{fd}"><div class="c-col"><div class="c-col-lbl">Column A</div>{l_html}</div><div class="c-col"><div class="c-col-lbl">Column B</div>{r_html}</div></div>'

                elif stype == "three_cards":
                    cards = slide.get('cards',[])
                    if not cards:
                        cards = [{"card_title":f"Point {k+1}","card_content":b} for k,b in enumerate(bullets[:3])]
                    fd = "flex-direction:column;" if is_v else ""
                    ch = "".join([f'<div class="c-col" style="border-color:#4F46E5;"><div style="font-size:0.9rem;font-weight:700;color:#818CF8;margin-bottom:5px;">{c.get("card_title","")}</div><div style="font-size:0.82rem;color:#CBD5E1;">{c.get("card_content","")}</div></div>' for c in cards])
                    layout = f'<div style="display:flex;gap:12px;margin-bottom:1.25rem;{fd}">{ch}</div>'

                elif stype == "big_stat":
                    layout = f'<div style="background:#1E293B;border-radius:6px;padding:14px;border:1px dashed #4F46E5;margin-bottom:1.25rem;"><div style="font-size:2.5rem;font-weight:800;color:#818CF8;">{slide.get("stat_value","")}</div><div style="font-size:0.9rem;font-weight:700;color:white;">{slide.get("stat_description","")}</div></div>' + "".join([f'<div class="c-b">• {b}</div>' for b in bullets])

                elif stype == "timeline":
                    steps = slide.get('timeline_steps',[])
                    if not steps:
                        steps = [{"step_title":f"Phase {k+1}","step_desc":b} for k,b in enumerate(bullets[:4])]
                    if is_v:
                        sh = "".join([f'<div style="display:flex;gap:12px;margin-bottom:12px;"><div style="display:flex;flex-direction:column;align-items:center;"><div style="width:18px;height:18px;border-radius:50%;background:#6366F1;"></div></div><div class="c-col" style="flex-grow:1;"><div style="font-size:0.82rem;font-weight:700;color:#818CF8;">{s.get("step_title","")}</div><div style="font-size:0.75rem;color:#94A3B8;">{s.get("step_desc","")}</div></div></div>' for s in steps])
                    else:
                        sh = "".join([f'<div style="flex:1;text-align:center;"><div style="width:18px;height:18px;border-radius:50%;background:#6366F1;margin:0 auto 8px;"></div><div style="font-size:0.82rem;font-weight:700;color:white;">{s.get("step_title","")}</div><div style="font-size:0.72rem;color:#94A3B8;margin-top:3px;">{s.get("step_desc","")}</div></div>' for s in steps])
                        sh = f'<div style="position:relative;display:flex;gap:8px;"><div style="position:absolute;top:9px;left:5%;right:5%;height:1px;background:#334155;"></div>{sh}</div>'
                    layout = f'<div style="margin-bottom:1.25rem;">{sh}</div>'

                elif stype == "team_grid":
                    members = slide.get('team_members',[])
                    if not members:
                        members = [{"name":b.split("-")[0].strip(),"role":"","bio":b} for b in bullets[:3]]
                    fd = "flex-direction:column;" if is_v else ""
                    mh = "".join([f'<div class="c-col" style="text-align:center;"><div style="width:48px;height:48px;border-radius:50%;background:#475569;margin:0 auto 8px;display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:1.1rem;">{m.get("name","?")[0]}</div><div style="font-size:0.9rem;font-weight:700;color:white;">{m.get("name","")}</div><div style="font-size:0.75rem;color:#818CF8;font-weight:700;margin-bottom:4px;">{m.get("role","")}</div><div style="font-size:0.7rem;color:#94A3B8;">{m.get("bio","")}</div></div>' for m in members])
                    layout = f'<div style="display:flex;gap:12px;margin-bottom:1.25rem;{fd}">{mh}</div>'

                else:  # title_and_content / section_header
                    layout = "".join([f'<div class="c-b">• {b}</div>' for b in bullets])
                    layout = f'<div style="margin-bottom:1.25rem;">{layout}</div>'

                tw_html = f'<div class="c-tw">💡 Key Takeaway: {slide.get("key_takeaway","")}</div>' if slide.get("key_takeaway") else ""
                st.markdown(f"""
                <div class="canvas" style="{mock_style}">
                    <div class="canvas-lbl">Canvas Preview</div>
                    <div class="c-hdr">
                        <div class="c-t">{slide.get("title","")}</div>
                        <div class="c-s">{slide.get("summary","")}</div>
                    </div>
                    {layout}
                    {tw_html}
                </div>""", unsafe_allow_html=True)

                # Speaker Notes
                notes = slide.get('speaker_notes','')
                if notes:
                    with st.expander("🗒️ 발표자 스크립트 보기"):
                        st.markdown(f"<div style='color:var(--text2);font-size:0.9rem;line-height:1.7;'>{notes}</div>",
                                    unsafe_allow_html=True)

                st.write("")
                st.markdown("#### ✨ Magic Edit — AI 즉시 수정")
                me1, me2 = st.columns([4, 1])
                sid = slide.get('_id', str(i))
                with me1:
                    inst = st.text_input(
                        "수정 지시사항",
                        placeholder="예: '임원 발표용으로 글자수를 30% 줄이고 전문적인 톤으로 바꿔줘'",
                        key=f"mi_{sid}",
                        label_visibility="collapsed",
                    )
                with me2:
                    if st.button("수정 실행", key=f"mb_{sid}", use_container_width=True):
                        if not inst:
                            st.warning("지시사항을 입력하세요.")
                        else:
                            with st.spinner("AI가 수정하는 중..."):
                                new_slide = magic_edit_slide(slide, inst, st.session_state['lang'])
                            if new_slide:
                                new_slide['_id'] = sid
                                st.session_state['presentation_data']['slides'][i] = new_slide
                                trigger_pptx_recompile()
                                st.success("수정 완료!")
                                time.sleep(0.4)
                                st.rerun()

        st.divider()
        st.markdown("### 📥 최종 파일 내보내기")

        if 'compiled_pptx' in st.session_state and st.session_state['compiled_pptx']:
            safe = re.sub(r'[\\/*?:"<>| ]', '_', st.session_state['topic'])
            st.download_button(
                label="📥  완전히 편집 가능한 PowerPoint (.pptx) 다운로드",
                data=st.session_state['compiled_pptx'],
                file_name=f"{safe}.pptx",
                mime="application/vnd.openxmlformats-officedocument.presentationml.presentation",
                use_container_width=False,
            )
        else:
            st.warning("PPTX 파일이 아직 준비되지 않았습니다. 슬라이드 빌드 단계로 돌아가세요.")
            if st.button("← 슬라이드 빌드로"):
                st.session_state['step'] = 4
                st.session_state['generation_progress'] = True
                st.rerun()

        st.write("")
        if st.button("← 빌드 단계로"):
            st.session_state['step'] = 4; st.rerun()
