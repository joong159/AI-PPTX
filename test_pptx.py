import json
from ppt_compiler import compile_presentation

# Dummy presentation data mimicking the Gemini output format with advanced layouts
dummy_data = {
    "presentation_title": "고급 레이아웃 테스트",
    "presentation_subtitle": "Snapdeck AI 레이아웃 엔진 검증용 데모",
    "slides": [
        {
            "slide_index": 1,
            "slide_type": "two_column",
            "title": "1. 2단 컬럼 배치 (Two Column)",
            "summary": "좌우 두 개 영역으로 내용을 나누어 시각적으로 비교 분석합니다.",
            "bullets": [
                "좌측 컬럼: AI가 슬라이드 내용을 기반으로 알맞은 구도를 매핑합니다.",
                "좌측 컬럼: 세밀한 위치 연산이 컴파일러에 내장되어 있습니다.",
                "우측 컬럼: 사용자는 수정 가능한 진짜 파워포인트를 얻습니다.",
                "우측 컬럼: 텍스트 박스, 카드도 개별 편집 가능합니다."
            ],
            "key_takeaway": "2단 배치로 슬라이드의 가독성과 정보 밀도를 극대화할 수 있습니다."
        },
        {
            "slide_index": 2,
            "slide_type": "three_cards",
            "title": "2. 3단 카드 그리드 (Three Cards)",
            "summary": "3가지 주요 특징이나 솔루션의 강점을 분리된 카드 상자로 나열합니다.",
            "cards": [
                {
                    "card_title": "첫 번째 강점",
                    "card_content": "세련된 둥근 사각형 카드 디자인을 슬라이드 내에 좌우 병렬 배치합니다."
                },
                {
                    "card_title": "두 번째 강점",
                    "card_content": "선택한 테마의 포인트 배경색(accent_bg)이 자동으로 칠해집니다."
                },
                {
                    "card_title": "세 번째 강점",
                    "card_content": "4:5 캐러셀 포맷에서는 모바일에 맞춰 상하로 자동 적층됩니다."
                }
            ],
            "key_takeaway": "카드 분할 배치는 청중에게 정보를 구조화하여 보여주는 최적의 방식입니다."
        },
        {
            "slide_index": 3,
            "slide_type": "timeline",
            "title": "3. 프로세스 타임라인 (Timeline)",
            "summary": "단계별 실행 로드맵이나 시간의 흐름을 하나의 축선 위에 정렬합니다.",
            "timeline_steps": [
                {"step_title": "1단계: 기획", "step_desc": "주제 및 원본 문서를 바탕으로 AI 아웃라인 구상"},
                {"step_title": "2단계: 조판", "step_desc": "디자인 색상 테마 및 레이아웃 자동 매핑"},
                {"step_title": "3단계: 생성", "step_desc": "컴파일러가 좌표 수학을 통해 슬라이드 렌더링"},
                {"step_title": "4단계: 완성", "step_desc": "수정 가능 피치덱 PPTX 다운로드 및 완성"}
            ],
            "key_takeaway": "성장 전략이나 단계별 목표를 설명할 때 시각적 타임라인이 필수적입니다."
        },
        {
            "slide_index": 4,
            "slide_type": "team_grid",
            "title": "4. 팀 프로필 카드 (Team Profile)",
            "summary": "창업 멤버 및 핵심 리더십을 세련된 외곽선 프로필 카드로 소개합니다.",
            "team_members": [
                {
                    "name": "홍길동",
                    "role": "CEO / 기술 아키텍트",
                    "bio": "구글 인공지능 연구소 출신, 다중 컴파일 엔진 특허 보유."
                },
                {
                    "name": "이순신",
                    "role": "CMO / 글로벌 마케팅",
                    "bio": "스탠포드 MBA 졸업, 글로벌 SaaS 연간 매출 $10M 성장 리드."
                }
            ],
            "key_takeaway": "기술과 실무 사업 역량을 골고루 구비한 최정예 창업 드림팀 구성."
        }
    ]
}

if __name__ == "__main__":
    print("[테스트] python-pptx 고급 레이아웃 생성 테스트를 시작합니다...")
    try:
        compile_presentation(dummy_data, "test_advanced_output.pptx")
        print("[성공] test_advanced_output.pptx 파일이 정상적으로 빌드되었습니다!")
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"[실패] PPT 생성 중 오류 발생: {e}")
