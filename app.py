import os
import re
import json
import io
import time
import streamlit as st
from dotenv import load_dotenv
import google.generativeai as genai
from ppt_compiler import compile_presentation, THEMES

# Load env variables
load_dotenv()

# Page configuration
st.set_page_config(
    page_title="Snapdeck - Build a winning deck in a snap",
    page_icon="✨",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom premium CSS for styling the landing page, signup, onboarding and wizard
st.markdown("""
<style>
    /* Styling variables and resets */
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
    
    html, body, [data-testid="stAppViewContainer"] {
        background-color: #0B0F19 !important;
        color: #F8FAFC !important;
        font-family: 'Inter', 'Malgun Gothic', sans-serif !important;
    }
    
    /* Navigation Bar */
    .navbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 3rem;
        background-color: rgba(15, 23, 42, 0.8);
        backdrop-filter: blur(12px);
        border-bottom: 1px solid rgba(51, 65, 85, 0.4);
        position: sticky;
        top: 0;
        z-index: 100;
        margin-bottom: 2rem;
    }
    .nav-logo {
        font-weight: 800;
        font-size: 1.8rem;
        background: linear-gradient(135deg, #818CF8 0%, #4F46E5 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        text-decoration: none;
    }
    .nav-links {
        display: flex;
        gap: 2rem;
        align-items: center;
    }
    .nav-link {
        color: #94A3B8;
        text-decoration: none;
        font-weight: 600;
        transition: color 0.2s;
    }
    .nav-link:hover {
        color: #F8FAFC;
    }
    
    /* Hero Section */
    .hero-section {
        text-align: center;
        padding: 6rem 1rem 4rem 1rem;
        max-width: 900px;
        margin: 0 auto;
    }
    .hero-title {
        font-size: 4.5rem;
        font-weight: 800;
        line-height: 1.1;
        margin-bottom: 1.5rem;
        background: linear-gradient(135deg, #F8FAFC 30%, #94A3B8 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }
    .hero-subtitle {
        font-size: 1.4rem;
        color: #94A3B8;
        line-height: 1.5;
        margin-bottom: 3rem;
    }
    
    /* Glassmorphism Buttons */
    .btn-primary {
        background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%);
        color: #F8FAFC;
        font-weight: 700;
        padding: 0.9rem 2.2rem;
        border-radius: 8px;
        border: none;
        box-shadow: 0 4px 20px rgba(79, 70, 229, 0.4);
        cursor: pointer;
        transition: all 0.2s;
        text-decoration: none;
        display: inline-block;
        font-size: 1.1rem;
    }
    .btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 24px rgba(79, 70, 229, 0.6);
    }
    
    /* Feature Grid Section */
    .section-title {
        text-align: center;
        font-size: 2.2rem;
        font-weight: 700;
        margin-top: 5rem;
        margin-bottom: 3rem;
    }
    .feature-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 2rem;
        padding: 0 3rem;
        margin-bottom: 6rem;
    }
    .feature-card {
        background: rgba(15, 23, 42, 0.6);
        border: 1px solid rgba(51, 65, 85, 0.5);
        border-radius: 12px;
        padding: 2rem;
        transition: all 0.3s;
        box-shadow: 0 4px 30px rgba(0, 0, 0, 0.2);
    }
    .feature-card:hover {
        transform: translateY(-5px);
        border-color: rgba(99, 102, 241, 0.6);
        box-shadow: 0 10px 30px rgba(99, 102, 241, 0.1);
    }
    .feature-icon {
        font-size: 2.2rem;
        margin-bottom: 1rem;
    }
    .feature-head {
        font-size: 1.3rem;
        font-weight: 700;
        margin-bottom: 0.8rem;
        color: #F8FAFC;
    }
    .feature-desc {
        color: #94A3B8;
        font-size: 0.95rem;
        line-height: 1.5;
    }
    
    /* Social Signup Buttons */
    .signup-container {
        max-width: 480px;
        margin: 4rem auto;
        padding: 3rem;
        background: rgba(15, 23, 42, 0.8);
        border: 1px solid rgba(51, 65, 85, 0.6);
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    }
    .signup-title {
        text-align: center;
        font-size: 2rem;
        font-weight: 800;
        margin-bottom: 0.5rem;
        background: linear-gradient(135deg, #818CF8, #4F46E5);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }
    .signup-sub {
        text-align: center;
        color: #94A3B8;
        font-size: 0.95rem;
        margin-bottom: 2.5rem;
    }
    .social-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        width: 100%;
        padding: 0.8rem;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        margin-bottom: 1rem;
        border: 1px solid transparent;
        transition: all 0.2s;
        font-size: 0.95rem;
    }
    .btn-google {
        background-color: #FFFFFF;
        color: #1F2937;
        border: 1px solid #E5E7EB;
    }
    .btn-google:hover {
        background-color: #F9FAFB;
    }
    .btn-kakao {
        background-color: #FEE500;
        color: #191919;
    }
    .btn-kakao:hover {
        background-color: #FADA0A;
    }
    .btn-apple {
        background-color: #000000;
        color: #FFFFFF;
        border: 1px solid #334155;
    }
    .btn-apple:hover {
        background-color: #111827;
    }
    
    /* Wizard steps (Generator View) */
    .step-container {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background-color: #0F172A;
        padding: 1rem 2rem;
        border-radius: 10px;
        margin-bottom: 2rem;
        border: 1px solid #1E293B;
    }
    .step-item {
        text-align: center;
        font-family: 'Inter', sans-serif;
        font-weight: 600;
        color: #64748B;
        font-size: 0.95rem;
    }
    .step-item.active {
        color: #818CF8;
        font-size: 1.05rem;
        text-shadow: 0 0 10px rgba(129, 140, 248, 0.4);
    }
    .step-item.completed {
        color: #34D399;
    }
    .step-divider {
        height: 2px;
        background-color: #334155;
        flex-grow: 1;
        margin: 0 1rem;
    }
    
    .slide-card {
        background-color: #F8FAFC;
        border: 1px solid #E2E8F0;
        border-left: 5px solid #4F46E5;
        border-radius: 8px;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .slide-header {
        font-weight: 700;
        color: #1E293B;
        font-size: 1.2rem;
        margin-bottom: 1rem;
        display: flex;
        justify-content: space-between;
    }
</style>
""", unsafe_allow_html=True)

# Session state initialization
if 'view' not in st.session_state:
    st.session_state['view'] = 'landing'
if 'step' not in st.session_state:
    st.session_state['step'] = 1
if 'topic' not in st.session_state:
    st.session_state['topic'] = ""
if 'source_text' not in st.session_state:
    st.session_state['source_text'] = ""
if 'lang' not in st.session_state:
    st.session_state['lang'] = "한국어"
if 'category' not in st.session_state:
    st.session_state['category'] = "Startup Pitch (투자 유치 및 IR 덱)"
if 'deck_format' not in st.session_state:
    st.session_state['deck_format'] = "Standard (16:9)"
if 'theme' not in st.session_state:
    st.session_state['theme'] = "Nordic Tech (Ice White & Indigo)"
if 'presentation_data' not in st.session_state:
    st.session_state['presentation_data'] = None
if 'slide_count' not in st.session_state:
    st.session_state['slide_count'] = 5
if 'generation_progress' not in st.session_state:
    st.session_state['generation_progress'] = False

# API key setup helper
def initialize_gemini():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        if 'gemini_api_key' in st.session_state:
            api_key = st.session_state['gemini_api_key']
    return api_key

api_key = initialize_gemini()

# Navigation Bar
def render_navbar():
    col_logo, col_menu = st.columns([1, 2])
    with col_logo:
        st.markdown('<a href="#" class="nav-logo">⚡ snapdeck</a>', unsafe_allow_html=True)
    with col_menu:
        st.markdown("""
        <div class="nav-links" style="justify-content: flex-end;">
            <a href="#" class="nav-link">Features</a>
            <a href="#" class="nav-link">Pricing</a>
            <a href="#" class="nav-link">Blog</a>
        </div>
        """, unsafe_allow_html=True)

# ask_gemini_for_presentation, magic_edit_slide, compile_presentation functions are imported/used below...

# --- VIEW 1: LANDING PAGE ---
if st.session_state['view'] == 'landing':
    render_navbar()
    
    # Hero Section
    st.markdown("""
    <div class="hero-section">
        <div class="hero-title">Build a winning deck<br>in a snap.</div>
        <div class="hero-subtitle">Create professional presentations effortlessly with AI-powered slide generation. Draft outline, structure visually, compile to editable slides.</div>
    </div>
    """, unsafe_allow_html=True)
    
    # Hero CTA Button
    col_c1, col_c2, col_c3 = st.columns([4, 2, 4])
    with col_c2:
        if st.button("Get Started — It's Free 🚀", key="hero_cta", use_container_width=True):
            st.session_state['view'] = 'signup'
            st.rerun()
            
    # Mock canvas editor showcase in dark style
    st.markdown("""
    <div style="max-width:960px; margin:4rem auto; padding:15px; border-radius:12px; background:rgba(30,41,59,0.5); border:1px solid rgba(51,65,85,0.6); box-shadow:0 15px 40px rgba(0,0,0,0.6);">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #334155; padding-bottom:10px; margin-bottom:15px;">
            <div style="display:flex; gap:8px;">
                <div style="width:12px; height:12px; border-radius:50%; background-color:#EF4444;"></div>
                <div style="width:12px; height:12px; border-radius:50%; background-color:#F59E0B;"></div>
                <div style="width:12px; height:12px; border-radius:50%; background-color:#10B981;"></div>
            </div>
            <div style="font-size:0.8rem; color:#94A3B8; font-family:monospace;">editor_v2_active.json</div>
            <div style="color:#818CF8; font-size:0.85rem; font-weight:bold;">1920 x 1080 Viewport</div>
        </div>
        <div style="background-color:#0F172A; border-radius:6px; height:320px; padding:30px; display:flex; flex-direction:column; justify-content:center;">
            <div style="border-left:4px solid #6366F1; padding-left:15px; margin-bottom:20px;">
                <div style="font-size:2.2rem; font-weight:800; color:white;">AI 진단 보조 솔루션 피치덱</div>
                <div style="font-size:0.95rem; color:#94A3B8;">의료 효율성 극대화와 환자 안전을 위한 AI 혁신</div>
            </div>
            <div style="display:flex; gap:20px; margin-bottom:20px;">
                <div style="flex:1; background-color:#1E293B; border-radius:6px; padding:15px; border:1px solid #334155;">
                    <span style="color:#818CF8; font-weight:bold; font-size:0.85rem;">EHR 직접 연동 API</span>
                    <div style="font-size:0.8rem; color:#CBD5E1; margin-top:5px;">기존 병원 시스템에 API 기반으로 직접 긴밀하게 연동됩니다.</div>
                </div>
                <div style="flex:1; background-color:#1E293B; border-radius:6px; padding:15px; border:1px solid #334155;">
                    <span style="color:#818CF8; font-weight:bold; font-size:0.85rem;">48시간 내 도입 완료</span>
                    <div style="font-size:0.8rem; color:#CBD5E1; margin-top:5px;">복잡한 인프라 개편 없이 48시간 이내에 현업 배치 가능합니다.</div>
                </div>
            </div>
            <div style="background-color:#1E1B4B; border-radius:6px; padding:10px 15px; color:#A5B4FC; font-size:0.85rem; width:fit-content;">💡 Key Takeaway: 환자 안전을 보장하는 최적의 AI 어시스턴트 보급</div>
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    # Feature Section
    st.markdown('<div class="section-title">Why choose Snapdeck?</div>', unsafe_allow_html=True)
    
    st.markdown("""
    <div class="feature-grid">
        <div class="feature-card">
            <div class="feature-icon">📝</div>
            <div class="feature-head">AI Outliner</div>
            <div class="feature-desc">Structure first, compile later. AI organizes title, points, and narrative flow in seconds before drawing slides.</div>
        </div>
        <div class="feature-card">
            <div class="feature-icon">✨</div>
            <div class="feature-head">Magic Edit</div>
            <div class="feature-desc">Refine slide content with simple chat instructions. Shorten text, improve tone, or change structures on the fly.</div>
        </div>
        <div class="feature-card">
            <div class="feature-icon">📐</div>
            <div class="feature-head">Dynamic Layouts</div>
            <div class="feature-desc">AI dynamically selects cards, grids, timelines, or stats depending on meaning instead of plain boring bullets.</div>
        </div>
        <div class="feature-card">
            <div class="feature-icon">📥</div>
            <div class="feature-head">PPTX Export</div>
            <div class="feature-desc">Download fully editable PowerPoint files. Edit shapes, colors, layout boxes, and text directly in MS Office.</div>
        </div>
        <div class="feature-card">
            <div class="feature-icon">📱</div>
            <div class="feature-head">Social Carousel</div>
            <div class="feature-desc">Generate 4:5 vertical carousels for LinkedIn, Instagram, and Threads with responsive geometry.</div>
        </div>
    </div>
    """, unsafe_allow_html=True)

    # Pricing Section
    st.markdown('<div class="section-title">Simple Pricing</div>', unsafe_allow_html=True)
    col_p1, col_p2, col_p3 = st.columns([2, 3, 3])
    with col_p2:
        st.markdown("""
        <div style="background-color:#1E293B; border-radius:12px; padding:2.5rem; border:1px solid #334155; text-align:center; height:320px;">
            <div style="font-size:1.4rem; font-weight:700; color:#94A3B8;">Free Plan</div>
            <div style="font-size:2.8rem; font-weight:800; color:white; margin:15px 0;">$0</div>
            <div style="color:#CBD5E1; font-size:0.95rem; margin-bottom:20px;">AI 슬라이드 기본 생성<br>기본 레이아웃 템플릿<br>수출 시 워터마크 표시</div>
        </div>
        """, unsafe_allow_html=True)
        if st.button("Start for Free", key="price_free", use_container_width=True):
            st.session_state['view'] = 'signup'
            st.rerun()
            
    with col_p3:
        st.markdown("""
        <div style="background-color:#1E1B4B; border-radius:12px; padding:2.5rem; border:2px solid #6366F1; text-align:center; position:relative; height:320px; box-shadow:0 10px 30px rgba(99, 102, 241, 0.25);">
            <div style="position:absolute; top:-12px; left:50%; transform:translateX(-50%); background-color:#6366F1; color:white; font-size:0.75rem; font-weight:bold; padding:3px 12px; border-radius:12px;">RECOMMENDED</div>
            <div style="font-size:1.4rem; font-weight:700; color:#A5B4FC;">Pro Plan</div>
            <div style="font-size:2.8rem; font-weight:800; color:white; margin:15px 0;">$15 <span style="font-size:1rem; color:#94A3B8; font-weight:normal;">/ mo</span></div>
            <div style="color:#CBD5E1; font-size:0.95rem; margin-bottom:20px;">제한 없는 AI 세대 무제한<br>실시간 AI Magic Edit 활성화<br>브랜드 키트 로고 및 테마 이식</div>
        </div>
        """, unsafe_allow_html=True)
        if st.button("Upgrade to Pro", key="price_pro", use_container_width=True):
            st.session_state['view'] = 'signup'
            st.rerun()

# --- VIEW 2: SIGNUP PAGE ---
elif st.session_state['view'] == 'signup':
    render_navbar()
    
    st.markdown("""
    <div class="signup-container">
        <div class="signup-title">Create Account</div>
        <div class="signup-sub">Get started with your free Snapdeck account in a snap.</div>
    </div>
    """, unsafe_allow_html=True)
    
    col_su1, col_su2, col_su3 = st.columns([4, 3, 4])
    with col_su2:
        # Social Logins buttons styled with markdown
        if st.button("🔴 Google 계정으로 계속하기", key="btn_g", use_container_width=True):
            st.session_state['view'] = 'onboarding'
            st.rerun()
        if st.button("💛 카카오 계정으로 계속하기", key="btn_k", use_container_width=True):
            st.session_state['view'] = 'onboarding'
            st.rerun()
        if st.button("🍏 Apple 계정으로 계속하기", key="btn_a", use_container_width=True):
            st.session_state['view'] = 'onboarding'
            st.rerun()
            
        st.markdown("<div style='text-align:center; color:#64748B; margin: 1.5rem 0;'>or sign up with email</div>", unsafe_allow_html=True)
        
        email = st.text_input("Email address", placeholder="name@company.com")
        password = st.text_input("Password", type="password")
        
        st.write("")
        if st.button("회원가입 완료", key="btn_email_signup", use_container_width=True):
            if email and password:
                st.session_state['view'] = 'onboarding'
                st.rerun()
            else:
                st.warning("이메일과 비밀번호를 입력해 주세요.")
                
        st.markdown("<br><div style='text-align:center;'><a href='#' style='color:#818CF8; font-size:0.85rem; text-decoration:none;'>이미 계정이 있으신가요? 로그인</a></div>", unsafe_allow_html=True)

# --- VIEW 3: ONBOARDING SURVEY ---
elif st.session_state['view'] == 'onboarding':
    render_navbar()
    
    st.markdown("""
    <div style="max-width:700px; margin:3rem auto; padding:2.5rem; background:rgba(15, 23, 42, 0.8); border:1px solid rgba(51, 65, 85, 0.6); border-radius:12px;">
        <h2 style="text-align:center; margin-bottom:10px;">Snapdeck 서비스 온보딩 설문</h2>
        <p style="text-align:center; color:#94A3B8; font-size:0.95rem; margin-bottom:2rem;">작업 방식에 맞춤형 템플릿과 스타일 제안을 제공해 드립니다.</p>
    </div>
    """, unsafe_allow_html=True)
    
    col_ob1, col_ob2, col_ob3 = st.columns([2, 5, 2])
    with col_ob2:
        st.markdown("#### 🌐 주로 어떤 언어로 작업하시나요?")
        st.caption("선택한 언어를 기준으로 Snapdeck이 슬라이드를 기획해 드립니다.")
        
        languages = [
            "English", "한국어", "日本語", "中文 (简)", "中文 (繁)",
            "Español", "Français", "Deutsch", "Português", "Italiano",
            "Русский", "العربية", "हिंदी", "Nederlands", "Polski",
            "Türkçe", "Tiếng Việt", "ภาษาไทย", "Bahasa", "Svenska"
        ]
        
        # Display languages in 4 columns of checkboxes
        lang_cols = st.columns(4)
        selected_lang = "한국어" # default fallback
        for idx, lang in enumerate(languages):
            col_idx = idx % 4
            with lang_cols[col_idx]:
                if st.checkbox(lang, value=(lang == "한국어"), key=f"ob_lang_{lang}"):
                    selected_lang = lang if lang != "中文 (简)" else "中文 (简体)"
                    # map Chinese names to match ask_gemini
                    if selected_lang == "中文 (繁)": selected_lang = "中文 (繁體)"
                    
        st.write("")
        st.markdown("#### 📊 어떤 프레젠테이션을 만들 예정이신가요?")
        st.caption("해당하는 항목을 모두 선택해 주세요. 작업 목적에 맞는 템플릿을 최우선 제안합니다.")
        
        category_options = [
            "Startup Pitch (투자 유치 및 IR 덱)",
            "Business Report (전략, 분석 및 인사이트)",
            "Academic (연구 및 학습 발표)",
            "Sales Deck (제안서 및 세일즈 덱)",
            "Other (그 외 다른 목적)"
        ]
        selected_cats = []
        for cat in category_options:
            if st.checkbox(cat, value=(cat == "Startup Pitch (투자 유치 및 IR 덱)"), key=f"ob_cat_{cat}"):
                selected_cats.append(cat)
                
        st.session_state['lang'] = selected_lang
        if selected_cats:
            st.session_state['category'] = selected_cats[0] # Take first selected
            
        st.markdown("<br><br>", unsafe_allow_html=True)
        if st.button("서비스 시작하기 🚀", key="btn_ob_submit", use_container_width=True):
            st.session_state['view'] = 'generator'
            st.rerun()

# --- VIEW 4: GENERATOR WIZARD APP ---
elif st.session_state['view'] == 'generator':
    # Add Home/Log out button in sidebar
    with st.sidebar:
        st.markdown("---")
        if st.button("⬅ Snapdeck 메인으로 이동"):
            st.session_state['view'] = 'landing'
            st.session_state['step'] = 1
            st.rerun()
            
    # Check if API Key exists
    if not api_key:
        with st.sidebar:
            st.warning("⚠️ API Key가 설정되지 않았습니다.")
            entered_key = st.text_input("Gemini API Key를 입력하세요:", type="password")
            if entered_key:
                st.session_state['gemini_api_key'] = entered_key
                with open(".env", "w", encoding="utf-8") as f:
                    f.write(f"GEMINI_API_KEY={entered_key}\n")
                st.success("API Key 저장 완료! 페이지를 리로드합니다.")
                st.rerun()
    else:
        with st.sidebar:
            st.success("🔑 API Key 연결 완료")
            if st.button("API Key 변경"):
                st.session_state['gemini_api_key'] = ""
                if os.path.exists(".env"):
                    os.remove(".env")
                st.rerun()

    # Reuse core Wizard application flow
    # Render Wizard Progress Header
    render_progress_header()

    # STEP 1: Prompt (프롬프트 입력 및 문서 업로드)
    if st.session_state['step'] == 1:
        st.markdown("### 📝 1단계: 만드려는 발표 자료 기획안 입력")
        st.markdown("만들고 싶은 내용을 자연어로 상세하게 입력해 주세요. 주제, 목표, 핵심 요점 등을 많이 알려줄수록 훌륭한 슬라이드가 기획됩니다.")
        
        topic = st.text_area(
            "발표 자료 제목 및 핵심 기획 아이디어 입력",
            value=st.session_state['topic'],
            placeholder="예: 헬스케어 비효율 해소를 위한 AI 진단 솔루션의 투자 유치 자료. 문제점, 솔루션 특징, 현재 실적(ARR), 창업 팀, 자금 모집 로드맵 포함.",
            height=100
        )
        
        st.markdown("---")
        st.markdown("#### 📁 참고용 원본 문서 추가 (선택사항)")
        st.markdown("기존의 기획서, 보고서, 원본 텍스트 등이 있는 경우 아래에 제공해주세요. AI가 본문 내용을 철저히 분석하여 슬라이드로 기획합니다.")
        
        col_u1, col_u2 = st.columns([1, 1])
        with col_u1:
            uploaded_file = st.file_uploader(
                "텍스트 파일 업로드 (.txt, .md 지원)", 
                type=["txt", "md"], 
                help="업로드한 파일 내의 문장 정보를 추출해 기획 참고 자료로 사용합니다."
            )
            if uploaded_file is not None:
                try:
                    file_content = uploaded_file.read().decode("utf-8")
                    st.session_state['source_text'] = file_content
                    st.success("✅ 파일 내용 읽기 성공! 본문에 동기화되었습니다.")
                except Exception as e:
                    st.error(f"파일을 읽는 중 오류가 발생했습니다: {e}")
                    
        with col_u2:
            source_paste = st.text_area(
                "또는 원본 문서의 텍스트 내용을 직접 복사-붙여넣기 하세요:",
                value=st.session_state['source_text'],
                placeholder="노션, 메일, PDF 등에서 긁어온 원본 글을 여기에 붙여넣어 주세요...",
                height=140,
                help="제공된 글의 주요 수치와 정보를 기반으로 슬라이드 팩트를 정밀 매핑합니다."
            )
            st.session_state['source_text'] = source_paste
            
        st.markdown("---")
        col_l1, col_l2 = st.columns(2)
        with col_l1:
            languages = [
                "한국어", "English", "日本語", "中文 (简体)", "中文 (繁體)", 
                "Español", "Français", "Deutsch", "Português", "Italiano",
                "Русский", "العربية", "हिंदी", "Nederlands", "Polski", 
                "Türkçe", "Tiếng Việt", "ภาษาไทย", "Bahasa", "Svenska"
            ]
            lang = st.selectbox("기본 작업 언어 선택", languages, index=languages.index(st.session_state['lang']))
        with col_l2:
            categories = [
                "Startup Pitch (투자 유치 및 IR 덱)",
                "Business Report (전략, 분석 및 인사이트)",
                "Academic (연구 및 학습 발표)",
                "Sales Deck (제안서 및 세일즈 덱)",
                "Other (그 외 다른 목적)"
            ]
            category = st.selectbox("발표 덱 목적 분류", categories, index=categories.index(st.session_state['category']))
            
        st.session_state['topic'] = topic
        st.session_state['lang'] = lang
        st.session_state['category'] = category
        
        st.markdown("<br>", unsafe_allow_html=True)
        if st.button("2단계로 이동 (스타일 선택) ➡"):
            if not topic:
                st.warning("주제를 먼저 기술해 주세요!")
            else:
                st.session_state['step'] = 2
                st.rerun()

    # STEP 2: Style & Theme (스타일 및 테마 선택)
    elif st.session_state['step'] == 2:
        st.markdown("### 🎨 2단계: 스타일 및 디자인 테마 선택")
        st.markdown("발표 덱의 기본 비율 형식과 시각적 색상 정체성을 설정하세요. 디자인 정책은 전체 슬라이드에 일관되게 즉시 적용됩니다.")
        
        col_f1, col_f2 = st.columns(2)
        with col_f1:
            formats = [
                "Standard (16:9)", 
                "Social Carousel (4:5)", 
                "Keynote Widescreen (16:10)", 
                "Report / Document (A4-Horizontal)", 
                "Classic Slide (4:3)"
            ]
            deck_format = st.radio("덱 비율 형식(Format) 선택", formats, index=formats.index(st.session_state['deck_format']))
        with col_f2:
            selected_theme = st.selectbox(
                "색상 테마(Color Theme) 라이브러리 선택",
                list(THEMES.keys()),
                index=list(THEMES.keys()).index(st.session_state['theme'])
            )
            
        st.session_state['deck_format'] = deck_format
        st.session_state['theme'] = selected_theme
        
        colors = THEMES[selected_theme]
        st.markdown("#### 테마 팔레트 프리뷰")
        
        st.markdown(f"""
        <div style="display:flex; gap:10px;">
            <div class="theme-preview-card" style="background-color: rgb(248, 250, 252); flex:1; border: 1px solid rgb(226, 232, 240);">
                <div style="color: rgb(30, 41, 59); font-weight:bold; font-size:1.1rem; margin-bottom:8px;">Standard Slide Preview</div>
                <div style="color: rgb(71, 85, 105); font-size:0.85rem;">이것은 테마 색상으로 표현된 본문 텍스트입니다. 깔끔하고 눈이 편안한 여백을 구성합니다.</div>
                <div style="height:3px; background-color: rgb(79, 70, 229); margin: 8px 0; width:60px;"></div>
                <div style="background-color: rgb(238, 242, 255); color: rgb(79, 70, 229); padding: 5px 8px; border-radius:4px; font-size:0.75rem; font-style:italic;">💡 Key Takeaway 인사이트 박스</div>
            </div>
            <div class="theme-preview-card" style="background-color: rgb(15, 23, 42); flex:1; border: 1px solid rgb(30, 41, 59);">
                <div style="color: white; font-weight:bold; font-size:1.1rem; margin-bottom:8px;">Dark Title Slide Preview</div>
                <div style="color: rgb(129, 140, 248); font-size:0.85rem;">인상 깊은 인트로를 심어주는 타이틀 다크 배경 테마</div>
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        col_nav = st.columns([1, 1, 8])
        with col_nav[0]:
            if st.button("⬅ 이전"):
                st.session_state['step'] = 1
                st.rerun()
        with col_nav[1]:
            if st.button("다음 ➡"):
                st.session_state['step'] = 3
                st.rerun()

    # STEP 3: Outline Review & Edit (아웃라인 구성안 편집)
    elif st.session_state['step'] == 3:
        st.markdown("### 📋 3단계: AI 기획 목차 검토 및 마우스 편집")
        st.markdown("본격적인 슬라이드 생성을 시작하기 전, AI가 제안한 슬라이드 뼈대와 기획 내용을 원하는대로 마우스로 직접 수정합니다.")
        
        # Check if outline is already generated, if not, generate it
        if st.session_state['presentation_data'] is None:
            # We call ask_gemini_for_presentation inside app.py scope
            # Ensure proper model setup
            def run_ask_gemini():
                return ask_gemini_for_presentation(
                    st.session_state['topic'], 
                    st.session_state['lang'], 
                    st.session_state['category'], 
                    st.session_state['slide_count'],
                    st.session_state['source_text']
                )
            
            with st.spinner("AI가 입력하신 프롬프트 정보를 분석하여 슬라이드별 목차(Outline)와 텍스트를 기획하는 중..."):
                data = run_ask_gemini()
                if data:
                    st.session_state['presentation_data'] = data
                    st.success("기획안 작성이 완료되었습니다! 아래 아웃라인을 확인해 주세요.")
                else:
                    st.error("기획안을 불러오지 못했습니다. 이전 단계로 돌아가 주제 입력을 다시 확인해 주세요.")
                    if st.button("⬅ 1단계로 가기"):
                        st.session_state['step'] = 1
                        st.rerun()
                    st.stop()
                    
        data = st.session_state['presentation_data']
        
        col_h1, col_h2 = st.columns(2)
        with col_h1:
            data["presentation_title"] = st.text_input("프레젠테이션 메인 타이틀 (Title)", value=data.get("presentation_title", ""))
        with col_h2:
            data["presentation_subtitle"] = st.text_input("부제목/회사 정보 (Subtitle)", value=data.get("presentation_subtitle", ""))
            
        st.write("") # Spacer
        
        updated_slides = []
        for i, slide in enumerate(data.get("slides", [])):
            st.markdown(f"""
            <div class='slide-card'>
                <div class='slide-header'>
                    <span>Slide {slide.get('slide_index', i+1)}</span>
                    <span style='font-size:0.9rem; color:#4F46E5; font-weight:normal;'>레이아웃 형식: {slide.get('slide_type', 'title_and_content')}</span>
                </div>
            </div>
            """, unsafe_allow_html=True)
            
            col_c1, col_c2 = st.columns(2)
            with col_c1:
                slide_title = st.text_input(f"슬라이드 {i+1} 제목", value=slide.get("title", ""), key=f"title_{i}")
                slide_summary = st.text_input(f"슬라이드 {i+1} 요약", value=slide.get("summary", ""), key=f"summary_{i}")
                slide_type = st.selectbox(
                    f"슬라이드 {i+1} 레이아웃 타입", 
                    ["title_and_content", "section_header", "big_stat", "two_column", "three_cards", "timeline", "team_grid"],
                    index=["title_and_content", "section_header", "big_stat", "two_column", "three_cards", "timeline", "team_grid"].index(slide.get("slide_type", "title_and_content")),
                    key=f"type_{i}"
                )
                
                stat_value = ""
                stat_desc = ""
                if slide_type == "big_stat":
                    col_s1, col_s2 = st.columns(2)
                    with col_s1:
                        stat_value = st.text_input("핵심 수치 지표값 (Value)", value=slide.get("stat_value", "100%"), key=f"stat_val_{i}")
                    with col_s2:
                        stat_desc = st.text_input("수치 부연 설명 (Description)", value=slide.get("stat_description", "주요 지표"), key=f"stat_desc_{i}")
                
                cards_payload = []
                if slide_type == "three_cards":
                    cards = slide.get("cards", [])
                    if not cards or len(cards) < 3:
                        cards = [{"card_title": f"Card Title {k+1}", "card_content": f"Content {k+1}"} for k in range(3)]
                    for k in range(3):
                        c_col1, c_col2 = st.columns([1, 2])
                        with c_col1:
                            c_title = st.text_input(f"카드 {k+1} 제목", value=cards[k].get("card_title", ""), key=f"c_title_{i}_{k}")
                        with c_col2:
                            c_content = st.text_input(f"카드 {k+1} 본문", value=cards[k].get("card_content", ""), key=f"c_content_{i}_{k}")
                        cards_payload.append({"card_title": c_title, "card_content": c_content})
                
                timeline_payload = []
                if slide_type == "timeline":
                    steps = slide.get("timeline_steps", [])
                    if not steps or len(steps) < 4:
                        steps = [{"step_title": f"Step Title {k+1}", "step_desc": f"Description {k+1}"} for k in range(4)]
                    for k in range(4):
                        s_col1, s_col2 = st.columns([1, 2])
                        with s_col1:
                            s_title = st.text_input(f"단계 {k+1} 마일스톤", value=steps[k].get("step_title", ""), key=f"s_title_{i}_{k}")
                        with s_col2:
                            s_desc = st.text_input(f"단계 {k+1} 설명", value=steps[k].get("step_desc", ""), key=f"s_desc_{i}_{k}")
                        timeline_payload.append({"step_title": s_title, "step_desc": s_desc})
                        
                team_payload = []
                if slide_type == "team_grid":
                    members = slide.get("team_members", [])
                    if not members or len(members) < 2:
                        members = [{"name": f"Member {k+1}", "role": "Role", "bio": "Biography"} for k in range(2)]
                    for k in range(min(len(members), 3)):
                        m_col1, m_col2, m_col3 = st.columns([1, 1, 2])
                        with m_col1:
                            m_name = st.text_input(f"이름 {k+1}", value=members[k].get("name", ""), key=f"m_name_{i}_{k}")
                        with m_col2:
                            m_role = st.text_input(f"직책 {k+1}", value=members[k].get("role", ""), key=f"m_role_{i}_{k}")
                        with m_col3:
                            m_bio = st.text_input(f"약력 {k+1}", value=members[k].get("bio", ""), key=f"m_bio_{i}_{k}")
                        team_payload.append({"name": m_name, "role": m_role, "bio": m_bio})

            with col_c2:
                bullets_list = slide.get("bullets", [])
                bullets_text = "\n".join(bullets_list)
                
                slide_bullets_raw = st.text_area(
                    f"슬라이드 {i+1} 불렛 요약 내용 (엔터로 줄바꿈)", 
                    value=bullets_text, 
                    height=130, 
                    key=f"bullets_{i}"
                )
                parsed_bullets = [line.strip() for line in slide_bullets_raw.split("\n") if line.strip()]
                
                slide_takeaway = st.text_input(f"슬라이드 {i+1} Key Takeaway (💡 인사이트 요약)", value=slide.get("key_takeaway", ""), key=f"takeaway_{i}")
                
            updated_slide = {
                "slide_index": i + 1,
                "slide_type": slide_type,
                "title": slide_title,
                "summary": slide_summary,
                "bullets": parsed_bullets,
                "key_takeaway": slide_takeaway
            }
            if slide_type == "big_stat":
                updated_slide["stat_value"] = stat_value
                updated_slide["stat_description"] = stat_desc
            elif slide_type == "three_cards":
                updated_slide["cards"] = cards_payload
            elif slide_type == "timeline":
                updated_slide["timeline_steps"] = timeline_payload
            elif slide_type == "team_grid":
                updated_slide["team_members"] = team_payload
                
            updated_slides.append(updated_slide)
            st.markdown("<br>", unsafe_allow_html=True)
            
        data["slides"] = updated_slides
        st.session_state['presentation_data'] = data
        
        col_nav = st.columns([1, 1, 8])
        with col_nav[0]:
            if st.button("⬅ 이전 (스타일)"):
                st.session_state['step'] = 2
                st.rerun()
        with col_nav[1]:
            if st.button("생성 단계 진입 ➡"):
                st.session_state['step'] = 4
                st.session_state['generation_progress'] = True
                st.rerun()

    # STEP 4: Real-time Generate Simulation (실시간 슬라이드 조판 생성)
    elif st.session_state['step'] == 4:
        st.markdown("### ⚡ 4단계: 실시간 슬라이드 빌드 및 디자인 레이아웃 결합")
        st.markdown("아웃라인 정보와 선택한 스타일 테마를 결합하여 Canvas 조판 및 PPTX 파일을 실시간으로 컴파일하는 단계입니다.")
        
        progress_placeholder = st.empty()
        status_placeholder = st.empty()
        
        if st.session_state.get('generation_progress', False):
            st.session_state['generation_progress'] = False
            
            slide_count_actual = len(st.session_state['presentation_data'].get("slides", []))
            
            for i in range(101):
                progress_placeholder.progress(i)
                if i < 20:
                    status_placeholder.info("⚙️ 디자인 토큰 로더 활성화 및 캔버스 레이아웃 영역 설정 중...")
                elif i < 40:
                    status_placeholder.info(f"🎨 선택한 테마 색상 및 가독성 폰트 매핑 결합 중...")
                elif i < 80:
                    current_slide = int((i - 40) / (40 / slide_count_actual)) + 1
                    current_slide = min(current_slide, slide_count_actual)
                    status_placeholder.warning(f"✍️ Canvas Slide {current_slide}/{slide_count_actual} 텍스트 및 불렛 포인트 조판 자동 배치 중...")
                else:
                    status_placeholder.success("💡 파워포인트 파일 구조 최종 컴파일 및 수출 파일 스트림 버퍼 완료!")
                time.sleep(0.02)
                
            trigger_pptx_recompile()
                
        st.success("🎉 모든 슬라이드 조판 및 컴파일이 성공적으로 종료되었습니다!")
        
        st.markdown("#### 생성된 슬라이드 레이아웃 미리보기")
        
        data = st.session_state['presentation_data']
        cols_preview = st.columns(min(len(data.get("slides", [])), 4))
        
        for idx, slide in enumerate(data.get("slides", [])):
            col_idx = idx % len(cols_preview)
            with cols_preview[col_idx]:
                st.markdown(f"""
                <div style="background-color:white; border:1px solid #CBD5E1; border-radius:6px; padding:10px; min-height:160px; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                    <div style="font-size:0.75rem; color:#64748B; font-weight:bold; margin-bottom:5px;">SLIDE {idx+1}</div>
                    <div style="font-size:0.9rem; font-weight:bold; color:#1E293B; margin-bottom:5px;">{slide.get('title', '')}</div>
                    <div style="font-size:0.75rem; color:#475569; margin-bottom:8px;">Type: {slide.get('slide_type', '')}</div>
                    <div style="height:2px; background-color:#6366F1; width:30px; margin-bottom:8px;"></div>
                    <div style="font-size:0.7rem; color:#4F46E5; font-style:italic;">💡 {slide.get('key_takeaway', '')[:25]}...</div>
                </div>
                """, unsafe_allow_html=True)
                
        st.write("") # Spacer
        col_nav = st.columns([1, 1, 8])
        with col_nav[0]:
            if st.button("⬅ 아웃라인 수정"):
                st.session_state['step'] = 3
                st.rerun()
        with col_nav[1]:
            if st.button("최종 편집기 이동 ➡"):
                st.session_state['step'] = 5
                st.rerun()

    # STEP 5: Canvas Editor (최종 캔버스 에디터 & 수출)
    elif st.session_state['step'] == 5:
        st.markdown("### 🖥️ 5단계: Canvas Editor 상세 조정 및 Magic Edit")
        st.markdown("웹 상용화 단계에서는 **Fabric.js Canvas**를 적용하여 모든 요소를 세밀하게 다듬을 수 있습니다. 본 MVP 데모에서는 프리뷰 캔버스를 확인하고 **실시간 AI Magic Edit**을 사용할 수 있습니다.")
        
        st.info(f"📐 현재 설정된 덱 비율 형식: **{st.session_state['deck_format']}** (테마: **{st.session_state['theme']}**)")
        
        data = st.session_state['presentation_data']
        tabs = st.tabs([f"Slide {s.get('slide_index', i+1)}: {s.get('title', '')[:10]}" for i, s in enumerate(data.get("slides", []))])
        
        is_vertical = st.session_state['deck_format'] == "Social Carousel (4:5)"
        mockup_style = "min-height:500px; max-width:400px; margin:auto;" if is_vertical else "min-height:350px; width:100%;"
        
        for i, slide in enumerate(data.get("slides", [])):
            with tabs[i]:
                slide_type = slide.get("slide_type", "title_and_content")
                layout_html = ""
                
                if slide_type == "two_column":
                    bullets = slide.get("bullets", [])
                    half = len(bullets) // 2
                    col1 = bullets[:half] if half > 0 else bullets
                    col2 = bullets[half:] if half > 0 else []
                    
                    col_direction = "flex-direction:column;" if is_vertical else ""
                    layout_html = f"""
                    <div style="display:flex; gap:20px; margin-bottom:30px; {col_direction}">
                        <div style="flex:1; background-color:#1E293B; border-radius:6px; padding:15px; border:1px solid #334155;">
                            <span style="color:#818CF8; font-weight:bold; font-size:0.8rem;">Column 1</span>
                            {"".join([f"<div style='font-size:0.95rem; color:#E2E8F0; margin-top:8px;'>• {b}</div>" for b in col1])}
                        </div>
                        <div style="flex:1; background-color:#1E293B; border-radius:6px; padding:15px; border:1px solid #334155;">
                            <span style="color:#818CF8; font-weight:bold; font-size:0.8rem;">Column 2</span>
                            {"".join([f"<div style='font-size:0.95rem; color:#E2E8F0; margin-top:8px;'>• {b}</div>" for b in col2])}
                        </div>
                    </div>
                    """
                elif slide_type == "three_cards":
                    cards = slide.get("cards", [])
                    if not cards:
                        bullets = slide.get("bullets", [])
                        cards = [{"card_title": f"Card Title {idx+1}", "card_content": b} for idx, b in enumerate(bullets[:3])]
                    
                    col_direction = "flex-direction:column;" if is_vertical else ""
                    cards_html = ""
                    for card in cards:
                        cards_html += f"""
                        <div style="flex:1; background-color:#1E293B; border-radius:6px; padding:15px; border:1px solid #4F46E5; min-width:150px;">
                            <div style="font-size:1.0rem; font-weight:bold; color:#818CF8; margin-bottom:6px;">{card.get('card_title', '')}</div>
                            <div style="font-size:0.85rem; color:#CBD5E1;">{card.get('card_content', '')}</div>
                        </div>
                        """
                    layout_html = f"""
                    <div style="display:flex; gap:15px; margin-bottom:30px; {col_direction}">
                        {cards_html}
                    </div>
                    """
                elif slide_type == "timeline":
                    steps = slide.get("timeline_steps", [])
                    if not steps:
                        bullets = slide.get("bullets", [])
                        steps = [{"step_title": f"Phase {idx+1}", "step_desc": b} for idx, b in enumerate(bullets[:4])]
                    
                    if is_vertical:
                        steps_html = ""
                        for idx, step in enumerate(steps[:4]):
                            steps_html += f"""
                            <div style="display:flex; gap:15px; margin-bottom:15px;">
                                <div style="display:flex; flex-direction:column; align-items:center;">
                                    <div style="width:20px; height:20px; border-radius:50%; background-color:#6366F1;"></div>
                                    {'' if idx == len(steps)-1 else '<div style="width:2px; flex-grow:1; background-color:#334155; min-height:40px;"></div>'}
                                </div>
                                <div style="background-color:#1E293B; border-radius:6px; padding:10px; flex-grow:1; border:1px solid #334155;">
                                    <div style="font-size:0.9rem; font-weight:bold; color:#818CF8;">{step.get('step_title','')}</div>
                                    <div style="font-size:0.8rem; color:#94A3B8;">{step.get('step_desc','')}</div>
                                </div>
                            </div>
                            """
                        layout_html = f"<div style='margin-bottom:30px;'>{steps_html}</div>"
                    else:
                        steps_html = ""
                        for idx, step in enumerate(steps[:4]):
                            steps_html += f"""
                            <div style="flex:1; text-align:center; position:relative; min-width:100px;">
                                <div style="width:20px; height:20px; border-radius:50%; background-color:#6366F1; margin:0 auto 10px auto; z-index:2; position:relative;"></div>
                                <div style="font-size:0.95rem; font-weight:bold; color:white;">{step.get('step_title','')}</div>
                                <div style="font-size:0.8rem; color:#94A3B8; margin-top:4px; padding:0 5px;">{step.get('step_desc','')}</div>
                            </div>
                            """
                        layout_html = f"""
                        <div style="position:relative; display:flex; gap:10px; margin-bottom:30px; margin-top:20px;">
                            <div style="position:absolute; top:9px; left:12%; right:12%; height:2px; background-color:#334155; z-index:1;"></div>
                            {steps_html}
                        </div>
                        """
                elif slide_type == "team_grid":
                    members = slide.get("team_members", [])
                    if not members:
                        bullets = slide.get("bullets", [])
                        members = [{"name": b.split("-")[0].strip() if "-" in b else f"Member {k+1}", "role": "Role", "bio": b} for k, b in enumerate(bullets[:3])]
                    
                    col_direction = "flex-direction:column;" if is_vertical else ""
                    members_html = ""
                    for member in members:
                        members_html += f"""
                        <div style="flex:1; background-color:#1E293B; border-radius:6px; padding:15px; border:1px solid #334155; min-width:180px; text-align:center;">
                            <div style="width:60px; height:60px; border-radius:50%; background-color:#475569; margin:0 auto 10px auto; display:flex; align-items:center; justify-content:center; color:white; font-weight:bold; font-size:1.2rem;">{member.get('name','')[0]}</div>
                            <div style="font-size:1.0rem; font-weight:bold; color:white;">{member.get('name','')}</div>
                            <div style="font-size:0.8rem; color:#818CF8; font-weight:bold; margin-bottom:6px;">{member.get('role','')}</div>
                            <div style="font-size:0.75rem; color:#94A3B8;">{member.get('bio','')}</div>
                        </div>
                        """
                    layout_html = f"""
                    <div style="display:flex; gap:15px; margin-bottom:30px; {col_direction}">
                        {members_html}
                    </div>
                    """
                elif slide_type == "big_stat":
                    layout_html = f"""
                    <div style="margin-top:25px; margin-bottom:25px; background-color:#1E293B; border-radius:6px; padding:15px; border:1px dashed #4F46E5;">
                        <div style="font-size:2.8rem; font-weight:800; color:#818CF8; font-family:'Malgun Gothic';">{slide.get('stat_value', '')}</div>
                        <div style="font-size:0.95rem; font-weight:bold; color:white;">{slide.get('stat_description', '')}</div>
                    </div>
                    <div style="margin-left:10px; margin-bottom:40px;">
                        {"".join([f"<div style='font-size:1.05rem; color:#E2E8F0; margin-bottom:12px; font-family:Arial;'>•  {b}</div>" for b in slide.get('bullets', [])])}
                    </div>
                    """
                else: # title_and_content
                    layout_html = f"""
                    <div style="margin-left:10px; margin-bottom:40px; margin-top:20px;">
                        {"".join([f"<div style='font-size:1.05rem; color:#E2E8F0; margin-bottom:12px; font-family:Arial;'>•  {b}</div>" for b in slide.get('bullets', [])])}
                    </div>
                    """

                st.markdown(f"""
                <div style="background-color:#0F172A; border:2px solid #334155; border-radius:8px; padding:30px; position:relative; box-shadow:inset 0 0 20px rgba(0,0,0,0.6); {mockup_style}">
                    <div style="position:absolute; top:10px; right:15px; background-color:#1E293B; color:#818CF8; border:1px solid #334155; padding:3px 8px; border-radius:4px; font-size:0.75rem; font-family:monospace;">Fabric.js Canvas Active</div>
                    <!-- Slide Header -->
                    <div style="border-left:4px solid #6366F1; padding-left:15px; margin-bottom:20px; margin-top:20px;">
                        <div style="font-size:2.0rem; font-weight:800; color:white; font-family:'Malgun Gothic';">{slide.get('title', '')}</div>
                        <div style="font-size:0.95rem; color:#94A3B8; font-style:italic; margin-top:5px;">{slide.get('summary', '')}</div>
                    </div>
                    <!-- Dynamic Layout Content -->
                    {layout_html}
                    
                    <!-- Takeaway banner -->
                    {f"<div style='background-color:#1E1B4B; border:1px solid #312E81; border-radius:6px; padding:12px 15px; color:#A5B4FC; font-size:0.95rem; font-family:sans-serif;'>💡 Key Takeaway: {slide.get('key_takeaway', '')}</div>" if slide.get('key_takeaway') else ""}
                </div>
                """, unsafe_allow_html=True)
                
                st.markdown("<br>", unsafe_allow_html=True)
                
                # MAGIC EDIT FEATURE
                st.markdown("#### ✨ Snapdeck Magic Edit (AI 즉시 수정)")
                st.caption("해당 슬라이드 내용을 AI에게 명령하여 실시간으로 교정 및 톤 조정을 할 수 있습니다.")
                
                col_m1, col_m2 = st.columns([3, 1])
                with col_m1:
                    magic_inst = st.text_input(
                        "수정 지시사항을 자연어로 입력해 주세요:",
                        placeholder="예: '임원 발표용으로 글자수를 20% 줄이고 전문적인 톤으로 바꿔줘', '불렛을 2개로 압축해줘'",
                        key=f"magic_inst_{i}"
                    )
                with col_m2:
                    st.write("")
                    st.write("")
                    if st.button("Magic Edit 실행", key=f"magic_btn_{i}"):
                        if not magic_inst:
                            st.warning("지시사항을 먼저 입력해 주세요!")
                        else:
                            with st.spinner("AI가 해당 슬라이드 내용을 분석 및 부분 수정하는 중..."):
                                new_slide = magic_edit_slide(slide, magic_inst, st.session_state['lang'])
                                if new_slide:
                                    st.session_state['presentation_data']['slides'][i] = new_slide
                                    # Re-compile PPTX bytes
                                    trigger_pptx_recompile()
                                    st.success("슬라이드 수정 완료! 변경사항이 반영되었습니다.")
                                    time.sleep(0.5)
                                    st.rerun()
                                else:
                                    st.error("슬라이드 부분 수정 도중 오류가 발생했습니다.")
                                    
        st.markdown("---")
        st.markdown("### 📥 최종 발표 자료 내보내기")
        
        if 'compiled_pptx' in st.session_state and st.session_state['compiled_pptx'] is not None:
            safe_topic = re.sub(r'[\\/*?:"<>| ]', '_', st.session_state['topic'])
            st.download_button(
                label="📥 완벽히 편집 가능한 PowerPoint (.pptx) 다운로드",
                data=st.session_state['compiled_pptx'],
                file_name=f"{safe_topic}.pptx",
                mime="application/vnd.openxmlformats-officedocument.presentationml.presentation"
            )
        else:
            st.error("컴파일된 PPTX 파일이 존재하지 않습니다. 이전 단계로 이동해 컴파일을 수행해 주세요.")
            
        st.write("") # Spacer
        col_nav = st.columns([1, 8])
        with col_nav[0]:
            if st.button("⬅ 실시간 생성 확인"):
                st.session_state['step'] = 4
                st.rerun()
