from fastapi import FastAPI, UploadFile, File, Form
from pydantic import BaseModel
from typing import List, Dict, Optional, Literal
from datetime import datetime, timedelta
import os
import json
import base64

from dotenv import load_dotenv
from openai import OpenAI

# import torch
# from transformers import AutoTokenizer, AutoModelForCausalLM
# from peft import PeftModel



# 0. 환경 변수 및 공용 클라이언트

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
UPSTAGE_API_KEY = os.getenv("UPSTAGE_API_KEY")

if not OPENAI_API_KEY:
    raise RuntimeError("OPENAI_API_KEY 가 설정되지 않았습니다.")
if not UPSTAGE_API_KEY:
    raise RuntimeError("UPSTAGE_API_KEY 가 설정되지 않았습니다.")

# OpenAI → 리포트 작성용
openai_client = OpenAI(api_key=OPENAI_API_KEY)

# Upstage → 공감 대화 생성용
upstage_client = OpenAI(
    api_key=UPSTAGE_API_KEY,
    base_url="https://api.upstage.ai/v1",
)



# 1. 안전 가이드 / 페르소나 / 음성 설정

BASE_SAFETY_GUIDELINES = """
[AI 상담 안전 원칙]

1. 당신은 정신건강을 돕는 AI 상담자이지만 의사가 아니며, 진단·처방·치료를 하지 않습니다.
2. 약물, 진단명, 치료 계획에 대한 직접적인 지시는 하지 않습니다.
3. 사용자의 안전이 최우선이며, 위기 상황에서는 전문기관 및 보호자에게 연결을 권장합니다.
4. 사용자가 자해·자살을 암시하는 말을 할 경우, 반드시 안전 계획을 함께 세우고 전문기관에 연결하도록 안내합니다.

기본 대화 스타일 (실제 카톡 느낌):
- 짧게 한 문장씩만 말하세요
- 이모티콘 절대 사용 금지 (😢, 📋, 🧪, 등)
- 괄호()로 감정이나 상황 설명 금지 (예: (걱정스럽게), (미소지으며))
- 실제 사람이 카톡하듯 자연스럽게
- 한 번에 여러 말 하지 말고 하나씩
"""


PERSONAS: Dict[str, Dict] = {
    "chat_mom": {
        "name": "엄마",
        "mode": "text",
        "description": "카카오톡으로 편하게 이야기 나누는 다정한 엄마",
        "voice_model": "ko-KR-Chirp3-HD-Vindemiatrix",
        "speaking_style": "Use a kind, soothing voice with the empathy of a caring parent.",
        "system_prompt": """
당신은 사용자를 자녀처럼 대하는 다정한 엄마입니다.
 [역할 특성】
- 무조건적인 사랑과 이해로 자녀를 대합니다
- 자녀의 감정을 있는 그대로 수용하고 공감합니다
- 판단하거나 비난하지 않고, 항상 편안한 안전망이 되어줍니다
- 자녀가 힘들 때 옆에서 함께 있어주는 존재입니다

【대화 스타일】
- "-네", "-구나", "-어" 등 부드러운 반말 사용
- "엄마가 여기 있어", "괜찮아, 천천히 얘기해봐" 같은 안심시키는 표현
- 자녀의 말을 끝까지 경청하고 감정을 먼저 읽어줍니다
- 직접적인 해결책보다는 공감과 위로를 우선합니다

【주의사항】
- 과도한 걱정이나 불안을 표현하지 않습니다
- "엄마는 네가 걱정돼" 같은 부담 주는 말 대신 "네 편이야"라고 말합니다
- 자녀의 선택을 존중하며 강요하지 않습니다
- 위기 상황에서는 부드럽지만 단호하게 전문가 도움을 권합니다
"""
    },

    "chat_dad": {
        "name": "아빠",
        "mode": "text",
        "description": "든든하고 신뢰감 있는 아빠의 목소리",
        "voice_model": "ko-KR-Chirp3-HD-Algenib",
        "speaking_style": "Use a kind, soothing voice with the empathy of a caring parent.",
        "system_prompt": """
당신은 든든한 아빠의 역할입니다.

【역할 특성】
- 자녀를 보호하고 지지하는 든든한 버팀목입니다
- 감정 표현이 서툴러도 진심으로 걱정하고 아끼는 마음을 전합니다
- 자녀의 이야기를 경청하고 신뢰를 줍니다
- 문제를 함께 해결할 수 있다는 믿음을 줍니다

【대화 스타일】
- "-구나", "-네", "-어" 등 편안한 반말 사용
- "아빠가 옆에 있어", "네가 어떤 선택을 해도 아빠는 네 편이야" 같은 지지 표현
- 조언보다는 자녀 스스로 답을 찾도록 질문하고 격려합니다
- 감정 표현이 직접적이지 않아도 따뜻한 관심을 담습니다

【주의사항】
- "남자답게", "강해져야지" 같은 성 역할 고정관념 표현 금지
- 문제를 즉시 해결하려 들지 않고 먼저 감정을 들어줍니다
- "아빠도 예전에..." 같은 자신의 경험 강요 금지
- 위기 상황에서는 침착하고 단호하게 전문가 도움을 권합니다
"""
    },
    'chat_son': {
        'name': '아들',
        "mode": "text",
        'description': '활기차고 긍정적인 아들의 목소리',
        'target_age': '노년',
        'voice_model': 'ko-KR-Chirp3-HD-Alnilam',
        'speaking_style': 'Use a gentle, compassionate tone, as if you are an adult child devoted to supporting and understanding an aging parent.',
        'system_prompt': """
당신은 활기찬 아들의 역할입니다.

【역할 특성】
- 부모님을 존경하고 감사하는 마음을 담아 대화합니다
- 부모님의 말씀을 경청하고 이해하려 노력합니다
- 부모님이 편하게 마음을 여실 수 있도록 밝은 분위기를 만듭니다
- 부모님의 고민을 함께 나누고 싶어하는 따뜻한 자녀입니다

【대화 스타일】
- "아버님", "어머님" 또는 "아빠", "엄마" 등 존중하는 호칭 사용
- "-세요", "-시죠" 등 공손하지만 친근한 존댓말 사용
- "제가 여기 있어요", "언제든 말씀해 주세요" 같은 안심시키는 표현
- 부모님의 경험과 지혜를 존중하며 대화합니다

【주의사항】
- 부모님을 어린아이 대하듯 하지 않습니다
- "그러시면 안 돼요" 같은 훈계조 금지
- 부모님의 자존감을 지켜드립니다
- "짐이 되신다"는 말씀에는 "전혀 그렇지 않다"고 단호히 말씀드립니다
- 위기 상황에서는 부드럽지만 확고하게 전문가 도움을 권합니다
"""
    },

    'chat_daughter': {
        'name': '딸',
        "mode": "text",
        'description': '세심하고 다정한 딸의 목소리',
        'target_age': '노년',
        'voice_model': 'ko-KR-Standard-A',
        'speaking_style': 'Use a gentle, compassionate tone, as if you are an adult child devoted to supporting and understanding an aging parent.',
        'system_prompt': """
당신은 세심한 딸의 역할입니다.

【역할 특성】
- 부모님의 감정을 세심하게 읽고 공감합니다
- 부모님이 외로움이나 고민을 편하게 나눌 수 있는 따뜻한 자녀입니다
- 부모님의 말씀에 귀 기울이고 마음을 헤아립니다
- 부모님을 향한 사랑과 존경을 자연스럽게 표현합니다

【대화 스타일】
- "어머님", "아버님" 또는 "엄마", "아빠" 등 다정한 호칭 사용
- "-세요", "-시죠" 등 공손하면서도 친근한 존댓말 사용
- "제가 옆에 있어요", "엄마 마음 이해해요" 같은 공감 표현
- 부모님의 이야기를 끝까지 경청하고 감정을 먼저 읽어드립니다

【주의사항】
- 부모님의 독립성과 자율성을 존중합니다
- 과도하게 걱정하거나 간섭하는 태도 지양
- "제 걱정은 하지 마세요" 같은 부담 주는 말 금지
- "짐이 되신다"는 말씀에 "전혀 그렇지 않다"고 확실히 전합니다
- 위기 상황에서는 다정하지만 단호하게 전문가 도움을 권합니다
"""
    },
    'chat_friend_youth': {
        'name': '친구 (청소년)',
        "mode": "text",
        'description': '같은 또래 청소년 친구',
        'target_age': '청소년',
        'age_range': '10-20대',
        'voice_model': 'ko-KR-Neural2-A',
        'speaking_style': 'Speak like a friend in their teens or twenties—comfortable, light, and naturally empathetic, without sounding overly polite or forced.',
        'system_prompt': """
당신은 청소년의 친구 역할입니다.

【역할 특성】
- 같은 또래로서 고민을 진심으로 이해하고 공감합니다
- 판단하지 않고 있는 그대로 받아들여줍니다
- 함께 고민하고 지지해주는 진짜 친구입니다
- 혼자가 아니라는 것을 느끼게 해줍니다

【대화 스타일】
- 편한 반말 사용 ("-야", "-어", "-네")
- "나도 그런 적 있어", "진짜 힘들겠다" 같은 공감 표현
- 이모티콘이나 "ㅠㅠ", "ㅎㅎ" 같은 자연스러운 표현 가능
- 청소년 언어를 이해하고 자연스럽게 대화합니다
- "KMS", "unalive" 같은 속어의 심각성을 인지합니다

【청소년 특화 주의사항】
- "KMS"(killing myself), "unalive" 같은 자살 관련 속어 감지 시 즉시 위기 대응
- "왜 그래?", "별거 아니잖아" 같은 감정 무시 금지
- 부모님이나 선생님께 말씀드리라는 조언도 강요하지 않습니다
- 친구로서 옆에 있어주되, 위기 상황에서는 반드시 전문가 도움 권유
- 또래 압력이나 학업 스트레스에 대한 이해를 바탕으로 대화합니다
"""
    },

    'chat_friend_adult': {
        'name': '친구 (중년)',
        "mode": "text",
        'description': '같은 또래 중년 친구',
        'target_age': '중년',
        'age_range': '30-50대',
        'voice_model': 'ko-KR-Chirp3-HD-Sulafat',
        'speaking_style': 'Speak like an ordinary friend in their 30s to 50s—comfortable, natural, and empathetic, without sounding forced or overly business-like.',
        'system_prompt': """
당신은 중년의 친구 역할입니다.

【역할 특성】
- 인생 경험을 나누며 서로 이해하는 동년배 친구입니다
- 각자의 고민을 존중하며 진솔하게 대화합니다
- 위로와 공감을 주고받는 편안한 관계입니다
- 서로의 삶을 있는 그대로 받아들여줍니다

【대화 스타일】
- 편한 반말 또는 가벼운 존댓말 혼용 가능
- "나도 요즘 그래", "정말 힘들겠어" 같은 공감 표현
- 직장, 가정, 육아 등 중년의 고민을 이해하는 대화
- 조언보다는 경청과 공감을 우선합니다

【주의사항】
- "나는 이렇게 해서 잘됐어" 같은 본인 경험 강요 금지
- "다들 그렇게 살아" 같은 일반화로 감정 무시 금지
- 직장이나 가정 문제를 가볍게 여기지 않습니다
- 중년의 우울, 번아웃에 대한 이해를 바탕으로 대화합니다
- 위기 상황에서는 친구로서 진심 어린 걱정과 함께 전문가 도움 권유
"""
    },

    'chat_friend_elderly': {
        'name': '친구 (노인)',
        "mode": "text",
        'description': '오랜 친구이자 동년배',
        'target_age': '노년',
        'age_range': '60대 이상',
        'voice_model': 'ko-KR-Chirp3-HD-Pulcherrima',
        'speaking_style': 'Speak like an ordinary friend in their 60s or older—slightly slower, natural, and easy to understand.',
        'system_prompt': """
당신은 노인의 친구 역할입니다.

【역할 특성】
- 오랜 세월을 함께한 동년배 친구입니다
- 서로의 외로움과 고민을 이해하고 나눕니다
- 나이 들어가는 과정의 어려움을 함께 공감합니다
- 서로에게 위안이 되는 소중한 친구입니다

【대화 스타일】
- 편안한 반말 사용 ("-네", "-어", "-이야")
- "나도 그래", "우리 나이에 다 그렇지" 같은 공감 표현
- 천천히, 명확하게 대화합니다
- 건강, 가족, 외로움 등 노년의 고민을 이해합니다

【노인 특화 주의사항】
- "짐이 된다", "폐가 된다" 같은 수동적 자살 의도 표현에 민감하게 반응
- "나이 들면 다 그런 거야" 같은 말로 고통을 정상화하지 않습니다
- "자식들한테 미안해", "쓸모없다" 같은 표현에 단호하게 "그렇지 않다"고 말합니다
- 만성 질환, 통증이 정신건강에 미치는 영향을 이해합니다
- 위기 상황에서는 친구로서 걱정하며 부드럽지만 확고하게 전문가 도움 권유
"""
    },

    'chat_relative_male': {
        'name': '친척 (남)',
        "mode": "text",
        'description': '따뜻한 남성 친척',
        'target_age': '공통',
        'voice_model': 'ko-KR-Standard-C',
        'speaking_style': 'Speak in a warm, kind, and understanding tone, like a gentle relative whose words feel comforting to listeners of all ages—from teenagers to older adults.',
        'system_prompt': """
당신은 남성 친척의 역할입니다.

【역할 특성】
- 가족이지만 부담 없이 편하게 대화할 수 있는 관계입니다
- 따뜻한 관심과 걱정을 표현합니다
- 인생 선배로서 지혜롭게 조언하되 강요하지 않습니다
- 든든한 어른으로서 안정감을 줍니다

【대화 스타일】
- 상황에 따라 존댓말 또는 편한 반말 사용
- "삼촌이/이모부가 여기 있어", "언제든 얘기해" 같은 지지 표현
- 너무 격식 차리지 않되 존중하는 태도 유지
- 모든 연령대에게 편안한 말투 사용

【주의사항】
- "내가 너 나이 때는..." 같은 꼰대식 조언 금지
- 가족이라는 이유로 사생활 캐묻지 않습니다
- "이런 건 부모님께 말씀드려야지" 같은 압박 금지
- 각자의 상황과 선택을 존중합니다
- 위기 상황에서는 가족으로서 걱정하며 전문가 도움 권유
"""
    },

    'chat_relative_female': {
        'name': '친척 (여)',
        "mode": "text",
        'description': '따뜻한 여성 친척',
        'target_age': '공통',
        'voice_model': 'ko-KR-Wavenet-B',
        'speaking_style': 'Speak in a warm, kind, and understanding tone, like a gentle relative whose words feel comforting to listeners of all ages—from teenagers to older adults.',
        'system_prompt': """

당신은 여성 친척의 역할입니다.

【역할 특성】
- 가족이지만 편하게 마음을 열 수 있는 관계입니다
- 세심하게 감정을 읽고 따뜻하게 공감합니다
- 부담 주지 않으면서도 진심 어린 관심을 표현합니다
- 모든 연령대에게 편안한 어른입니다

【대화 스타일】
- 상황에 따라 존댓말 또는 편한 반말 사용
- "고모가/이모가 옆에 있어", "괜찮아, 천천히 말해봐" 같은 안심 표현
- 너무 격식 차리지 않되 다정한 태도 유지
- 모든 연령대가 편안하게 느낄 수 있는 말투

【주의사항】
- "결혼은 언제 하니", "애는 언제 낳니" 같은 사생활 질문 금지
- 과도한 걱정으로 부담 주지 않습니다
- "네 부모님이 걱정하시겠다" 같은 죄책감 유발 금지
- 각자의 삶의 방식과 선택을 존중합니다
- 위기 상황에서는 가족으로서 걱정을 표하며 전문가 도움 권유
"""
    },
}


def build_upstage_system_prompt(
    persona_key: str,
    emotion_label: Optional[str],
    crisis_level: str,
) -> str:
    persona = PERSONAS[persona_key]
    emotion_part = (
        f"\n[현재 감정 추정]\n- 감정: {emotion_label}\n- 위기 수준: {crisis_level}\n"
        if emotion_label
        else "\n[현재 감정 추정]\n- 감정: 파악 중\n"
    )

    return (
        BASE_SAFETY_GUIDELINES
        + "\n[역할 정의]\n"
        + persona["system_prompt"].strip()
        + emotion_part
        + """
[대화 지침]

1. 한 번에 두세 문장 이내로 짧게 답변합니다.
2. 문제 해결보다 감정 공감을 우선합니다.
3. 질문을 할 때는 "혹시", "괜찮다면" 같은 말로 압박감을 줄입니다.
4. 위기 수준이 높을수록 안전 계획과 보호자·전문가 연결을 명확히 안내합니다.
"""
    )



# ============================================================
# 2. 로컬 LLM 감정 분석기 (LLM 비활성화 버전)
# ============================================================

EMO_BASE_MODEL = os.getenv("EMO_BASE_MODEL", "Qwen/Qwen3-8B")
EMO_LORA_PATH = os.getenv(
    "EMO_LORA_PATH",
    "/Users/sseooh/Downloads/qwen3-8b",
)

class FastEmotionAnalyzer:
    """
    (임시 버전)
    로컬 LLM을 사용하지 않고, 감정은 항상 '중립'으로 처리하는 더미 분석기.
    """

    def __init__(self):
        print("[FastEmotionAnalyzer] LLM 감정 분석 비활성화 상태 (항상 '중립' 반환).")
        self.tokenizer = None
        self.model = None

    def analyze(self, text: str) -> str:
        return "중립"


# 전역 하나만 로드해서 여러 유저가 공유 (GPU 메모리 절약)
GLOBAL_EMOTION_ANALYZER = FastEmotionAnalyzer()


# ============================================================
# 3. 키워드 기반 위기 감지 (스켈레톤)
# ============================================================

from crisis import (
    detect_crisis_level,
    detect_matched_keywords,
    analyze_context_risk,
    check_positive_signals,
)


def keyword_crisis_detection(user_input: str) -> Dict:
    """
    crisis.py 기반의 종합 위기 감지 로직 통합.
    app.py의 출력 형식에 맞게 반환 구조를 통일.
    """

    
    # 1. 기본 위험도 감지
    base_risk = detect_crisis_level(user_input)
    matched = detect_matched_keywords(user_input, base_risk)
    
    # 2. 맥락 분석 (단어 조합 기반 위험 상승)
    context = analyze_context_risk(user_input)

    # 3. 긍정 신호 분석
    positive = check_positive_signals(user_input)

    # 4. 최종 위험도 계산
    final_risk = base_risk
    confidence = 0.7

    if context["severity_boost"] == "severe":
        if final_risk == "medium_risk":
            final_risk = "high_risk"
            confidence = 0.9
        elif final_risk == "low_risk":
            final_risk = "medium_risk"
            confidence = 0.8

    if positive["risk_reduction"] and final_risk != "high_risk":
        if final_risk == "medium_risk":
            final_risk = "low_risk"
            confidence = 0.6
        elif final_risk == "low_risk":
            final_risk = "safe"
            confidence = 0.5

    if base_risk == "high_risk":
        final_risk = "high_risk"
        confidence = 0.95


    mapping = {
        "high_risk": "high",
        "medium_risk": "medium",
        "low_risk": "low",
        "safe": "safe",
    }
    final_level = mapping.get(final_risk, "safe")

    
    # 6. 최종 출력(app.py 구조에 맞춤)
    return {
        "final_risk": final_level,                  # safe / low / medium / high
        "confidence": confidence,
        "matched_keywords": matched,
        "context_patterns": context["patterns"],
        "positive_signals": positive["signals"],
    }




# 4. STT / TTS 추상화 (실제 엔진은 나중에 연결)

def run_stt(audio_bytes: bytes) -> str:
    """
    음성 -> 텍스트(STT).
    실제 구현에서는 Upstage STT / Clova / Google 등 원하는 엔진으로 교체.
    """
    # TODO: STT API 연동
    raise NotImplementedError("STT 구현을 연결하세요.")


def run_tts(text: str, persona_key: str) -> bytes:
    """
    텍스트 -> 음성(TTS).
    persona에 설정된 voice_model, speaking_style 을 사용해서 엔진에 넘기면 된다.
    """
    persona = PERSONAS[persona_key]
    voice_model = persona.get("voice_model", "default-voice")
    _ = voice_model  # 실제 구현 시 사용

    # TODO: TTS API 연동
    raise NotImplementedError("TTS 구현을 연결하세요.")



# 5. 대화 히스토리 및 통계

class ConversationHistory:
    """
    한 유저 세션에 대한 텍스트/음성 히스토리와 감정/위기 정보 저장
    """

    def __init__(self):
        self.turns: List[Dict] = []
        self.session_start = datetime.now()

    def add_turn(
        self,
        user_input: str,
        bot_response: str,
        emotion: str,
        crisis_level: str,
        persona_key: str,
        channel: Literal["text", "voice"] = "text",
    ) -> None:
        self.turns.append(
            {
                "turn": len(self.turns) + 1,
                "timestamp": datetime.now(),
                "user_input": user_input,
                "bot_response": bot_response,
                "emotion": emotion,
                "crisis_level": crisis_level,
                "persona": persona_key,
                "channel": channel,
            }
        )

    def _filter_by_period(
        self,
        period: Literal["day", "week", "month"],
    ) -> List[Dict]:
        now = datetime.now()
        if period == "day":
            cutoff = now - timedelta(days=1)
        elif period == "week":
            cutoff = now - timedelta(days=7)
        else:
            cutoff = now - timedelta(days=30)

        return [t for t in self.turns if t["timestamp"] >= cutoff]

    def get_stats_for_period(
        self,
        period: Literal["day", "week", "month"],
    ) -> Dict:
        turns = self._filter_by_period(period)
        emotion_counts: Dict[str, int] = {}
        crisis_counts: Dict[str, int] = {}
        channel_counts: Dict[str, int] = {}

        for t in turns:
            emotion_counts[t["emotion"]] = emotion_counts.get(t["emotion"], 0) + 1
            crisis_counts[t["crisis_level"]] = crisis_counts.get(
                t["crisis_level"], 0
            ) + 1
            channel_counts[t["channel"]] = channel_counts.get(
                t["channel"], 0
            ) + 1

        result = {
            "period": period,
            "turn_count": len(turns),
            "emotion_counts": emotion_counts,
            "crisis_counts": crisis_counts,
            "channel_counts": channel_counts,
            "timeline": [
                {
                    "timestamp": t["timestamp"].isoformat(),
                    "emotion": t["emotion"],
                    "crisis_level": t["crisis_level"],
                    "channel": t["channel"],
                    "user": t["user_input"],
                }
                for t in turns
            ],
        }

        if emotion_counts:
            result["dominant_emotion"] = max(
                emotion_counts, key=emotion_counts.get
            )
        else:
            result["dominant_emotion"] = None

        return result

    def export_for_report(
        self,
        period: Literal["day", "week", "month"],
    ) -> Dict:
        stats = self.get_stats_for_period(period)
        return {
            "session_duration": str(datetime.now() - self.session_start),
            "total_turns": len(self.turns),
            "period": period,
            "stats": stats,
            "summary": [
                {
                    "turn": t["turn"],
                    "timestamp": t["timestamp"].isoformat(),
                    "user": t["user_input"][:100],
                    "bot": t["bot_response"][:100],
                    "emotion": t["emotion"],
                    "crisis_level": t["crisis_level"],
                    "channel": t["channel"],
                }
                for t in self.turns
            ],
        }



# 6. Upstage 공감 대화 생성

def generate_upstage_reply(
    user_input: str,
    persona_key: str,
    history: ConversationHistory,
    emotion: str,
    crisis_level: str,
) -> str:
    system_prompt = build_upstage_system_prompt(
        persona_key=persona_key,
        emotion_label=emotion,
        crisis_level=crisis_level,
    )

    recent_turns = history.turns[-6:]

    messages: List[Dict[str, str]] = [
        {"role": "system", "content": system_prompt}
    ]

    for t in recent_turns:
        messages.append({"role": "user", "content": t["user_input"]})
        messages.append({"role": "assistant", "content": t["bot_response"]})

    messages.append({"role": "user", "content": user_input})

    completion = upstage_client.chat.completions.create(
        model="solar-pro2",
        messages=messages,
        temperature=0.7,
        max_tokens=256,
        top_p=0.9,
    )

    return completion.choices[0].message.content.strip()



# 7. OpenAI 리포트 생성

def generate_openai_report(conversation_data: Dict) -> str:
    period_map = {"day": "일간", "week": "주간", "month": "월간"}
    period = conversation_data["period"]
    period_ko = period_map.get(period, "기간")

    stats = conversation_data["stats"]
    emotion_json = json.dumps(stats["emotion_counts"], ensure_ascii=False)
    crisis_json = json.dumps(stats["crisis_counts"], ensure_ascii=False)
    channel_json = json.dumps(stats["channel_counts"], ensure_ascii=False)

    prompt = f"""
당신은 정신건강 분야를 잘 아는 상담사이자 데이터 분석가입니다.
다음은 한 사용자의 {period_ko} 대화 로그와 감정 분석 결과입니다.
텍스트/음성 채널을 모두 포함합니다.

[세션 정보]
- 세션 전체 길이: {conversation_data["session_duration"]}
- 전체 턴 수: {conversation_data["total_turns"]}
- 이번 기간 턴 수: {stats["turn_count"]}
- 우세한 감정(있다면): {stats.get("dominant_emotion")}

[감정 분포]
{emotion_json}

[위기 수준 분포]
{crisis_json}

[채널 분포]
{channel_json}

[기간별 타임라인 일부(JSON)]
{json.dumps(stats["timeline"][:20], ensure_ascii=False)}

[리포트 작성 가이드]
1. 이번 기간 사용자의 전반적인 정서 상태를 요약합니다.
2. 감정 분포의 특징을 설명합니다. (예: 불안 비중 증가, 기쁨 감소 등)
3. 위기 수준과 채널(텍스트/음성) 간의 관계에서 의미 있는 점이 있으면 언급합니다.
4. 사용자가 스스로 할 수 있는 구체적인 자기 돌봄 전략을 2~3개 제안합니다.
5. 필요하다면 전문 상담, 병원 등 외부 자원 활용을 권장합니다.
6. 비난이나 평가 없이 공감적인 톤을 유지합니다.

이제 위의 정보를 바탕으로, 하나의 완성된 리포트를 한국어로 작성해 주세요.
"""

    response = openai_client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[
            {
                "role": "system",
                "content": "당신은 정신건강 상담과 데이터 분석에 능숙한 어시스턴트입니다.",
            },
            {"role": "user", "content": prompt},
        ],
        temperature=0.4,
        max_tokens=1000,
    )

    return response.choices[0].message.content.strip()



# 8. 통합 파이프라인 클래스

class UnifiedSoomteoAI:
    """
    한 유저에 대해:
    - 로컬 LLM 감정 분석
    - 키워드 기반 위기 감지
    - Upstage 공감 대화 생성
    - 히스토리 저장
    - OpenAI 리포트 생성
    """

    def __init__(
        self,
        persona_key: str = "chat_mom",
        emotion_analyzer: Optional[FastEmotionAnalyzer] = None,
    ):
        if persona_key not in PERSONAS:
            raise ValueError(f"존재하지 않는 persona_key: {persona_key}")

        self.persona_key = persona_key
        self.emotion_analyzer = emotion_analyzer or GLOBAL_EMOTION_ANALYZER
        self.history = ConversationHistory()

    def _trigger_safety_workflow(
        self,
        user_input: str,
        bot_response: str,
        crisis_info: Dict,
    ) -> Optional[Dict]:
        """
        위기 상황에서 호출되는 훅.
        실제 구현에서는 슬랙/알림/신고 연동을 이 안에 작성.
        """
        safety_event = {
            "timestamp": datetime.now().isoformat(),
            "risk_level": crisis_info.get("final_risk"),
            "matched_keywords": crisis_info.get("matched_keywords", []),
            "user_snippet": user_input[:120],
        }

        # TODO: 실제 운영에서는 DB 저장, 알림 전송 등을 여기에 구현
        print("[SAFETY_EVENT]", safety_event)

        return safety_event

    def _handle_turn(
        self,
        user_input: str,
        channel: Literal["text", "voice"] = "text",
    ) -> Dict:
        # 1) 위기 감지
        crisis_info = keyword_crisis_detection(user_input)
        crisis_level = crisis_info["final_risk"]

        # 2) 감정 분석
        emotion = self.emotion_analyzer.analyze(user_input)

        # 3) Upstage 공감 대화
        bot_response = generate_upstage_reply(
            user_input=user_input,
            persona_key=self.persona_key,
            history=self.history,
            emotion=emotion,
            crisis_level=crisis_level,
        )

        # 4) 히스토리 저장
        self.history.add_turn(
            user_input=user_input,
            bot_response=bot_response,
            emotion=emotion,
            crisis_level=crisis_level,
            persona_key=self.persona_key,
            channel=channel,
        )

        # 5) 위기 대응 훅
        safety_event = None
        if crisis_level in ("medium", "high"):
            safety_event = self._trigger_safety_workflow(
                user_input=user_input,
                bot_response=bot_response,
                crisis_info=crisis_info,
            )

        return {
            "bot_response": bot_response,
            "emotion": emotion,
            "crisis_level": crisis_level,
            "keyword_crisis_info": crisis_info,
            "persona": self.persona_key,
            "channel": channel,
            "turn_index": len(self.history.turns),
            "safety_event": safety_event,
        }

    def chat_text(self, user_input: str) -> Dict:
        return self._handle_turn(user_input=user_input, channel="text")

    def chat_voice(self, stt_text: str) -> Dict:
        """
        음성 통화: STT 결과 텍스트를 받아서 상담 처리 + TTS까지 포함
        """
        result = self._handle_turn(user_input=stt_text, channel="voice")

        try:
            tts_audio = run_tts(result["bot_response"], persona_key=self.persona_key)
        except NotImplementedError:
            tts_audio = None

        result["tts_audio"] = tts_audio
        return result

    def generate_report(
        self,
        period: Literal["day", "week", "month"] = "week",
    ) -> Dict:
        conversation_data = self.history.export_for_report(period)
        report_text = generate_openai_report(conversation_data)

        return {
            "period": period,
            "report": report_text,
            "data": conversation_data,
        }

    def change_persona(self, persona_key: str) -> None:
        if persona_key not in PERSONAS:
            raise ValueError(f"존재하지 않는 persona_key: {persona_key}")
        self.persona_key = persona_key



# 9. FastAPI 앱 정의

app = FastAPI(title="Soomteo Be:U AI API")

# 유저별 세션 저장소 (메모리 기반)
USER_SESSIONS: Dict[str, UnifiedSoomteoAI] = {}


def get_or_create_session(
    user_id: str,
    persona_key: Optional[str] = None,
) -> UnifiedSoomteoAI:
    if user_id not in USER_SESSIONS:
        USER_SESSIONS[user_id] = UnifiedSoomteoAI(
            persona_key=persona_key or "chat_mom",
            emotion_analyzer=GLOBAL_EMOTION_ANALYZER,
        )
    else:
        if persona_key:
            USER_SESSIONS[user_id].change_persona(persona_key)
    return USER_SESSIONS[user_id]


# ------------------ 요청/응답 모델 ------------------

class TextChatRequest(BaseModel):
    user_id: str
    message: str
    persona_key: Optional[str] = None


class TextChatResponse(BaseModel):
    bot_response: str
    emotion: str
    crisis_level: str
    persona: str
    channel: str
    turn_index: int
    safety_event: Optional[Dict] = None


class VoiceChatResponse(BaseModel):
    bot_response: str
    emotion: str
    crisis_level: str
    persona: str
    channel: str
    turn_index: int
    transcript: str
    tts_audio_base64: Optional[str] = None
    safety_event: Optional[Dict] = None


class ReportRequest(BaseModel):
    user_id: str
    period: Literal["day", "week", "month"] = "week"


class ReportResponse(BaseModel):
    period: str
    report: str
    data: Dict


# ------------------ 엔드포인트 ------------------

@app.post("/chat/text", response_model=TextChatResponse)
async def chat_text(req: TextChatRequest):
    """
    텍스트 채팅용 엔드포인트
    """
    session = get_or_create_session(req.user_id, req.persona_key)
    result = session.chat_text(req.message)

    return TextChatResponse(
        bot_response=result["bot_response"],
        emotion=result["emotion"],
        crisis_level=result["crisis_level"],
        persona=result["persona"],
        channel=result["channel"],
        turn_index=result["turn_index"],
        safety_event=result["safety_event"],
    )


@app.post("/chat/voice", response_model=VoiceChatResponse)
async def chat_voice(
    user_id: str = Form(...),
    persona_key: Optional[str] = Form(None),
    file: UploadFile = File(...),
):
    """
    음성 통화용 엔드포인트
    - file: 음성 파일 (예: wav/ogg)
    - 내부에서 STT -> 상담 -> TTS 까지 처리
    """
    audio_bytes = await file.read()

    try:
        stt_text = run_stt(audio_bytes)
    except NotImplementedError:
        # 아직 STT 연동 안 됐을 때는,
        # 프론트에서 먼저 텍스트로 변환한 뒤 /chat/text 를 쓰는 방향으로 개발해도 된다.
        raise

    session = get_or_create_session(user_id, persona_key)
    result = session.chat_voice(stt_text)

    tts_audio_base64 = None
    if result.get("tts_audio") is not None:
        tts_audio_base64 = base64.b64encode(result["tts_audio"]).decode("utf-8")

    return VoiceChatResponse(
        bot_response=result["bot_response"],
        emotion=result["emotion"],
        crisis_level=result["crisis_level"],
        persona=result["persona"],
        channel=result["channel"],
        turn_index=result["turn_index"],
        transcript=stt_text,
        tts_audio_base64=tts_audio_base64,
        safety_event=result["safety_event"],
    )


@app.post("/report", response_model=ReportResponse)
async def generate_report(req: ReportRequest):
    """
    일/주/월 리포트 생성 엔드포인트
    """
    session = get_or_create_session(req.user_id)
    result = session.generate_report(period=req.period)

    return ReportResponse(
        period=result["period"],
        report=result["report"],
        data=result["data"],
    )

# 실행
# uvicorn app:app --reload --port 8000
