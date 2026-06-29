import os
import sys
import re
import json
from dotenv import load_dotenv
import google.generativeai as genai
from ppt_compiler import compile_presentation

# 1. Setup & Configuration
load_dotenv()

def get_api_key():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("\n[!] GEMINI_API_KEY가 환경 변수 또는 .env 파일에서 발견되지 않았습니다.")
        api_key = input("Gemini API Key를 입력해주세요: ").strip()
        if not api_key:
            print("[오류] API Key가 필요합니다. 프로그램을 종료합니다.")
            sys.exit(1)
        # Save to .env for future runs
        with open(".env", "w", encoding="utf-8") as f:
            f.write(f"GEMINI_API_KEY={api_key}\n")
        print("[+] 입력하신 API Key를 .env 파일에 저장했습니다.\n")
    return api_key

# 2. Gemini Content Generation Engine
def ask_gemini_for_presentation(topic):
    """Requests outline and detailed content from Gemini in structured JSON."""
    model = genai.GenerativeModel("gemini-1.5-flash")
    
    prompt = f"""
    주제: "{topic}"
    위 주제에 대해 5~8장 분량의 고품질 발표용 파워포인트 슬라이드 데이터를 기획 및 작성해주세요.
    
    데이터 구조는 아래 규칙을 철저히 준수하는 유효한 JSON 포맷이어야 합니다.
    각 슬라이드 타입(slide_type)은 다음 중 어울리는 것을 골라 배치해 주세요:
    - 'title_and_content': 일반적인 핵심 요약 슬라이드 (불렛 포인트 3개 내외)
    - 'section_header': 발표의 흐름을 짚어주는 인트로/중간 전환용 슬라이드
    - 'big_stat': 통계, 성장세, 성과 등 핵심 지표를 크게 강조할 때 쓰는 슬라이드
    
    규칙:
    1. presentation_title 과 presentation_subtitle 은 청중을 끌어당길 수 있는 세련된 제목으로 한글로 지어주세요.
    2. slides 내부의 모든 문장은 한글로 명확하고 간결하며 세련되게 작성해주세요.
    3. big_stat 슬라이드인 경우 stat_value(예: '85%', '10배')와 stat_description(수치 설명)을 꼭 채워주세요.
    4. bullets는 지나치게 길지 않고 발표용 요약 텍스트로 잘 구성되어야 합니다.
    5. slide_type에 상관없이 summary는 슬라이드의 요약을 1문장으로 적어주세요.
    6. key_takeaway는 슬라이드 내용을 관통하는 1문장 인사이트(💡 문구로 하단에 출력될 예정)로 적어주세요.
    
    반드시 마크다운 코드 블록(```json 및 ```)을 제외하고, 오직 순수한 JSON 문자열 하나만 응답으로 반환해야 합니다.
    형식:
    {{
      "presentation_title": "세련된 제목",
      "presentation_subtitle": "부제목",
      "slides": [
        {{
          "slide_index": 1,
          "slide_type": "title_and_content",
          "title": "슬라이드 제목",
          "summary": "이 슬라이드 요약 (한 줄)",
          "bullets": [
            "주요 내용 첫 번째 요약",
            "주요 내용 두 번째 요약"
          ],
          "key_takeaway": "이 슬라이드의 최종 요약 인사이트"
        }},
        {{
          "slide_index": 2,
          "slide_type": "big_stat",
          "title": "시장 성장세 및 성과",
          "summary": "연평균 성장세 요약",
          "stat_value": "240%",
          "stat_description": "전년 대비 활성 사용자 증가율",
          "bullets": [
            "성장의 주요 원동력 설명",
            "사용자 행동 패턴 변화 설명"
          ],
          "key_takeaway": "사용자 지표가 급격히 우상향하고 있어 시장 선점이 시급함"
        }}
      ]
    }}
    """
    
    print("\n[AI] 슬라이드 기획안 및 콘텐츠를 생성하고 있습니다. 잠시만 기다려주세요...")
    
    # Force JSON output configuration
    generation_config = {
        "response_mime_type": "application/json",
        "temperature": 0.7
    }
    
    try:
        response = model.generate_content(prompt, generation_config=generation_config)
        content_text = response.text.strip()
        
        # Strip code blocks if AI included them anyway
        if content_text.startswith("```"):
            content_text = re.sub(r"^```(?:json)?\n", "", content_text, flags=re.MULTILINE)
            content_text = re.sub(r"\n```$", "", content_text, flags=re.MULTILINE)
            
        data = json.loads(content_text)
        return data
    except json.JSONDecodeError as je:
        print(f"[오류] AI 응답이 유효한 JSON 포맷이 아닙니다: {je}")
        if 'content_text' in locals():
            print(f"디버깅용 raw 응답:\n{content_text}")
        return None
    except Exception as e:
        print(f"[오류] API 호출 실패: {e}")
        return None

# 3. Main Interactivity Flow
def main():
    print("=" * 60)
    print("             AI PPT GENERATOR (CLI Version v1.0)")
    print("              - Snapdeck Style Interactive UX -")
    print("=" * 60)
    
    api_key = get_api_key()
    genai.configure(api_key=api_key)
    
    while True:
        topic = input("\n[?] 만들고 싶은 발표 자료의 주제나 프롬프트를 입력하세요\n(예: '인공지능의 시대와 개인의 대처법', '종료'는 q 입력): ").strip()
        if not topic or topic.lower() == 'q':
            print("프로그램을 종료합니다. 감사합니다!")
            break
            
        data = ask_gemini_for_presentation(topic)
        if not data:
            print("[!] 콘텐츠를 생성하지 못했습니다. 다시 시도해 주세요.")
            continue
            
        # 1단계: 목차 프리뷰 출력
        print("\n" + "=" * 50)
        print(f"📋 [목차 미리보기] {data.get('presentation_title')}")
        print(f"   부제: {data.get('presentation_subtitle')}")
        print("=" * 50)
        
        for slide in data.get("slides", []):
            idx = slide.get("slide_index", "?")
            title = slide.get("title", "제목 없음")
            summary = slide.get("summary", "내용 요약 없음")
            stype = slide.get("slide_type", "title_and_content")
            
            print(f" 슬라이드 {idx} [{stype}]")
            print(f"   ▶ 제목: {title}")
            print(f"   ▶ 요약: {summary}")
            print("-" * 50)
            
        # 2단계: 승인 확인
        choice = input("\n[?] 이 목차 구조로 파워포인트 파일을 생성하시겠습니까? (Y/n): ").strip().lower()
        if choice in ('', 'y', 'yes'):
            # Convert topic to a safe filename
            safe_topic = re.sub(r'[\\/*?:"<>| ]', '_', topic)
            output_file = f"{safe_topic}.pptx"
            
            print("\n[PPTX 컴파일러] 슬라이드 빌드 중...")
            compile_presentation(data, output_file)
            print(f"\n[+] 파워포인트 생성이 완료되었습니다: {output_file}")
            print("=" * 60)
        else:
            print("\n[-] 생성이 취소되었습니다. 새로운 주제를 입력할 수 있습니다.")

if __name__ == "__main__":
    main()
