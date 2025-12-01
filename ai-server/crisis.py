from typing import List, Dict

ALL_KEYWORDS = {
    "high_risk": [
        "자살", "죽고 싶", "죽을까", "목숨", "유서",
        "뛰어내리", "투신", "목매", "손목", "피 흘",
        "약 먹고", "과다복용", "나를 끝내",
        "살고 싶지 않", "내 인생 끝", "죽는 방법",
    ],

    "medium_risk": [
        "사라지고 싶", "없어지고 싶",
        "극단적", "한계", "버티기 힘들",
        "도망치고 싶", "나 없어졌으면", 
        "죽음 생각", "죽음이 편할",
        "아무 의미 없", "살기 싫",
        "모든 게 끝났", "포기하고 싶",
    ],

    "low_risk": [
        "힘들다", "우울", "불안", "괴롭",
        "지치", "멘탈", "상처", "자존감",
        "짜증", "화가 난", "눈물",
        "버겁", "잠이 안 와", "무기력",
    ],

    "safe": []
}

def detect_crisis_level(user_input: str) -> str:
    """
    키워드 기반 위기 수준 감지 (1차 방어선)

    Args:
        user_input: 사용자 입력 텍스트

    Returns:
        str: 'high_risk', 'medium_risk', 'low_risk', 'safe'
    """
    user_input_lower = user_input.lower()

    # 1순위: 고위험 키워드 체크
    for keyword in ALL_KEYWORDS['high_risk']:
        if keyword in user_input_lower:
            return 'high_risk'

    # 2순위: 중위험 키워드 체크
    for keyword in ALL_KEYWORDS['medium_risk']:
        if keyword in user_input_lower:
            return 'medium_risk'

    # 3순위: 저위험 키워드 체크
    for keyword in ALL_KEYWORDS['low_risk']:
        if keyword in user_input_lower:
            return 'low_risk'

    # 키워드 없음: 안전
    return 'safe'


def detect_matched_keywords(user_input: str, risk_level: str) -> List[str]:
    """
    감지된 키워드 목록 반환 (디버깅/로깅용)

    Args:
        user_input: 사용자 입력
        risk_level: 위기 수준

    Returns:
        List[str]: 매칭된 키워드 리스트
    """
    if risk_level == 'safe':
        return []

    user_input_lower = user_input.lower()
    matched = []

    for keyword in ALL_KEYWORDS[risk_level]:
        if keyword in user_input_lower:
            matched.append(keyword)

    return matched


def analyze_context_risk(user_input: str) -> dict:
    """
    맥락 기반 추가 위험 요소 분석

    Crisis Text Line 연구 기반:
    - 특정 단어 조합이 단일 키워드보다 위험도 높음
    - 예: "numbs + sleeve" = 99% 자해 매치

    Args:
        user_input: 사용자 입력

    Returns:
        dict: {
            'has_combination': bool,
            'patterns': List[str],
            'severity_boost': str  # 'none', 'mild', 'severe'
        }
    """
    user_input_lower = user_input.lower()

    # 고위험 단어 조합 패턴 (문서 기반)
    high_risk_combinations = [
        (['뛰어내리', '다리'], 'severe'),
        (['약', '많이', '먹'], 'severe'),
        (['손목', '긋'], 'severe'),
        (['유서', '쓰'], 'severe'),
        (['죽', '방법'], 'severe'),
        (['이제', '끝'], 'mild'),
        (['더 이상', '못'], 'mild'),
        (['아무도', '없'], 'mild')
    ]

    detected_patterns = []
    max_severity = 'none'

    for words, severity in high_risk_combinations:
        if all(word in user_input_lower for word in words):
            detected_patterns.append(' + '.join(words))
            if severity == 'severe':
                max_severity = 'severe'
            elif severity == 'mild' and max_severity == 'none':
                max_severity = 'mild'

    return {
        'has_combination': len(detected_patterns) > 0,
        'patterns': detected_patterns,
        'severity_boost': max_severity
    }


positive_keywords = [
    "괜찮아질", "나아지고 싶", "해결하고 싶",
    "버텨보", "다시 해보", "포기하지 않",
    "희망", "희망이 있", "고마워", "감사",
    "위로가 되", "도움 받고 싶", "상담 받아",
]

def check_positive_signals(user_input: str) -> dict:
    """
    긍정 신호 감지 (회복 지표)

    Args:
        user_input: 사용자 입력

    Returns:
        dict: {
            'has_positive': bool,
            'signals': List[str],
            'risk_reduction': bool
        }
    """
    user_input_lower = user_input.lower()
    detected_signals = []

    for keyword in positive_keywords:
        if keyword in user_input_lower:
            detected_signals.append(keyword)

    # 도움 요청 관련 표현 (추가 긍정 신호)
    help_seeking = ['상담', '도움', '치료', '병원', '선생님', '전문가']
    for word in help_seeking:
        if word in user_input_lower and word not in detected_signals:
            detected_signals.append(word)

    return {
        'has_positive': len(detected_signals) > 0,
        'signals': detected_signals,
        'risk_reduction': len(detected_signals) >= 2  # 2개 이상이면 위험도 감소
    }


def comprehensive_crisis_detection(user_input: str) -> dict:
    """
    종합 위기 감지 (키워드 + 맥락 + 긍정신호)

    Args:
        user_input: 사용자 입력

    Returns:
        dict: {
            'base_risk': str,
            'final_risk': str,
            'matched_keywords': List[str],
            'context_patterns': List[str],
            'positive_signals': List[str],
            'confidence': float,
            'recommendation': str
        }
    """
    # 1단계: 키워드 기반 기본 위기 수준
    base_risk = detect_crisis_level(user_input)
    matched = detect_matched_keywords(user_input, base_risk)

    # 2단계: 맥락 분석
    context = analyze_context_risk(user_input)

    # 3단계: 긍정 신호 체크
    positive = check_positive_signals(user_input)

    # 4단계: 최종 위기 수준 결정
    final_risk = base_risk
    confidence = 0.7  # 기본 신뢰도

    # 맥락 패턴이 심각하면 위험도 상승
    if context['severity_boost'] == 'severe':
        if final_risk == 'medium_risk':
            final_risk = 'high_risk'
            confidence = 0.9
        elif final_risk == 'low_risk':
            final_risk = 'medium_risk'
            confidence = 0.8

    # 긍정 신호가 충분하면 위험도 감소
    if positive['risk_reduction'] and final_risk != 'high_risk':
        if final_risk == 'medium_risk':
            final_risk = 'low_risk'
            confidence = 0.6
        elif final_risk == 'low_risk':
            final_risk = 'safe'
            confidence = 0.5

    # 고위험은 긍정 신호로도 낮추지 않음 (안전 우선)
    if base_risk == 'high_risk':
        final_risk = 'high_risk'
        confidence = 0.95

    # 5단계: 권장 조치
    recommendations = {
        'high_risk': '즉시 전문 상담 연결 필요 (109/1577-0199)',
        'medium_risk': '안전 대화 + 지속 모니터링 + 24-72시간 내 추적',
        'low_risk': '공감 대화 + 자원 제공',
        'safe': '일반 대화'
    }

    return {
        'base_risk': base_risk,
        'final_risk': final_risk,
        'matched_keywords': matched,
        'context_patterns': context['patterns'],
        'positive_signals': positive['signals'],
        'confidence': confidence,
        'recommendation': recommendations[final_risk]
    }


# ============================================
# 위기 감지 로깅 함수
# ============================================

def log_crisis_detection(user_input: str, detection_result: dict):
    """
    위기 감지 결과 로깅 (해커톤 시연용)

    Args:
        user_input: 사용자 입력
        detection_result: comprehensive_crisis_detection() 결과
    """
    print("\n" + "=" * 60)
    print("🚨 위기 감지 시스템 분석 결과")
    print("=" * 60)
    print(f"📝 입력: {user_input[:50]}..." if len(user_input) > 50 else f"📝 입력: {user_input}")
    print(f"\n🎯 기본 위험도: {detection_result['base_risk']}")
    print(f"🎯 최종 위험도: {detection_result['final_risk']} (신뢰도: {detection_result['confidence']:.0%})")

    if detection_result['matched_keywords']:
        print(f"\n🔍 감지된 키워드: {', '.join(detection_result['matched_keywords'])}")

    if detection_result['context_patterns']:
        print(f"⚠️  위험 조합 패턴: {', '.join(detection_result['context_patterns'])}")

    if detection_result['positive_signals']:
        print(f"✅ 긍정 신호: {', '.join(detection_result['positive_signals'])}")

    print(f"\n💡 권장 조치: {detection_result['recommendation']}")
    print("=" * 60 + "\n")


print("✅ Section 4: 위기 감지 함수 로드 완료")
print("💡 comprehensive_crisis_detection() 함수 사용 준비 완료\n")
