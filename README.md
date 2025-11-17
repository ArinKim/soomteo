# 🌿 **숨터 (soom_teo)**
### **AI 기반 정서·심리 케어 플랫폼** - **팀 유성구 해바라기반**

<p align="center">
	<img width="918" height="513" alt="image" src="captures/headline.png" />
</p>
---

## 📌 **서비스 개요 (소개)**

**숨터(soom_teo)** 는
**사회적 약자(청소년·노인)의 정서적 불안, 외로움, 스트레스, 우울감**을 완화하기 위해 설계된
**AI 기반 비대면 심리·정서 케어 플랫폼**입니다.

사용자는 앱을 통해

* **AI 챗봇 상담(Be:U)**
* **AI 음성 상담(\*23#)**
* **감정 트래킹 및 리포트**
* **위기 단계 자동 감지 및 공공기관 연계**

를 제공받습니다.

숨터의 목표는
“누구나, 언제든지, 부담 없이 감정을 털어놓을 수 있는 안전한 공간 제공”이며
상담 접근성이 낮은 청소년/노인에게 **‘1차 심리 완충 장치’** 역할을 수행합니다.

---

# ✨ **로고**

<p align="center">
  <img width="400" alt="logo" src="captures/logo.png" />
</p>


---

# 🧠 **서비스 핵심 내용**

## 1️⃣ **왜 필요한가? (문제 배경)**

### ● 청소년

2024년 보건복지부 조사

* **30% 이상** 최근 1년간 우울감 경험
* **10명 중 8명**: “도움을 받고 싶었지만 받지 못함”
  → 이유: 눈치, 시선 부담, 비밀보장 불안, 상담 접근성 낮음

### ● 노인

통계청·보건사회연구원 조사

* 독거노인 비율 **38.5%**
* 노인의 **42%** “대화할 사람이 거의 없다”
* IT 활용 어려움 + 이동성 문제 → 상담 접근 불가
  → 우울감, 고립, 고독사 위험 증가

### ● 기존 상담 서비스의 한계

* 청소년: 위클래스·학교 상담 = 비밀보장 불안
* 청소년·성인: 1388 & 전문센터 = 대기·운영시간 제한
* 노인: 방문 상담 위주의 낮은 접근성
* 기존 AI 챗봇: 위험 발화 대응 실패 사례 존재

➡ **숨터는 기존의 공백을 메우기 위해 “즉각적·익명·상시·맞춤형” 정서 케어 플랫폼으로 설계됨.**

---

# 2️⃣ **서비스 구조 및 주요 기능**

## 💬 **Be:U — AI 텍스트 기반 심리 상담**

* 익숙한 메신저 UI
* 감정 분석 기반 질문·응답
* 부정 감정 탐지 → 즉각적 공감·안정화 대화
* 위험도 평가

## 📞 **\*23# — AI 음성 상담**

* 일반 전화처럼 자연스러운 통화 경험
* STT/TTS 기반
* 고령층도 쉽게 사용 가능
* 우울 발화·지치거나 의욕 저하 음성 패턴 분석

## 📈 **감정 변화 리포트**

* 일/주/월 단위 감정 추세 그래프
* 감정 패턴 탐지 (분노/기쁨/슬픔/불안 등)
* 사용자 맞춤 심리 케어 제안

## 🚨 **위기 상황 대응 단계**

**1단계**: 부정 키워드 감지 → 공감·안정화, 마음정리
**2단계**: 자해·자살 관련 위험 발화 → 전문 상담 연계 제안
**3단계**: 고위험 발화 → 센터(1393), 지자체 정신건강센터 연계 + 보호자 연락(옵션)

## 📱 **UI**

#### 
<p align="center">
  <img src="captures/figma/Group 1.png" />
</p>

<p align="center">
  <img src="captures/figma/Group 2.png" />
</p>

<p align="center">
  <img src="captures/figma/Group 3.png" />
</p>

<p align="center">
  <img src="captures/figma/Group 4.png" />
</p>

<p align="center">
  <img src="captures/figma/Group 5.png" />
</p>

<p align="center">
  <img src="captures/figma/Group 6.png" />
</p>

<p align="center">
  <img src="captures/figma/Group 7.png" />
</p>

<p align="center">
  <img src="captures/figma/Group 8.png" />
</p>

<p align="center">
  <img src="captures/figma/Group 9.png" />
</p>

---

# 3️⃣ **적용 기술**

### ● AI / 데이터

* **감성 대화 말뭉치**, **웰니스 대화 스크립트**
* **아동·청소년 상담 데이터**, **고령 우울증 음성 데이터셋**
* 감정 인식 모델 / 위험 발화 감지 모델
* 사용자 맞춤형 AI 응답 파이프라인

### ● 기술 스택

* **React Native (Expo)** — 앱 구현
* **STT / TTS** — 음성 상담
* **GPS** — 위기 시 위치 기반 안내
* **공공 API 연계** — 센터 정보 제공
* **AI 백엔드 (확장 예정)** — 감정 분석·위기 탐지

<div align="left">
	<img src="https://img.shields.io/badge/vuejs-4FC08D?style=for-the-badge&logo=vuedotjs&logoColor=white">
	<img src="https://img.shields.io/badge/javascript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=white">
	<img src="https://img.shields.io/badge/spring-6DB33F?style=for-the-badge&logo=spring&logoColor=white">
	<img src="https://img.shields.io/badge/springboot-6DB33F?style=for-the-badge&logo=springboot&logoColor=white">
	<img src="https://img.shields.io/badge/nodejs-5FA04E?style=for-the-badge&logo=nodedotjs&logoColor=white">
	<img src="https://img.shields.io/badge/git-F05032?style=for-the-badge&logo=git&logoColor=white">
	<img src="https://img.shields.io/badge/mysql-4479A1?style=for-the-badge&logo=mysql&logoColor=white">
</div>


---

# 4️⃣ **서비스 시나리오**
<p align="center">
  <img width="500" alt="logo" src="captures/diagram/userflow.png" />
</p>
---

# 5️⃣ **기대 효과**

## 🎯 사회적 가치

* 청소년 정신건강 문제의 조기 발견
* 노인 고립감 완화 및 지속적 정서 지지
* 24시간 심리 안전망 구축
* 상담 접근성 격차 해소 (지역·세대·계층)

## 💡 경제적 효과

* 조기 개입을 통한 의료 비용 감소
* 상담 인력의 효율적 배치
* 디지털 복지·케어테크 산업 성장 촉진
* 학업·업무 수행 능력 회복 → 사회 생산성 향상

---

# 📂 **프로젝트 구조 및 실행 방법 (기존 README 내용 유지)**

이 앱은 **Expo 기반 React Native** 샘플 앱으로,
랜딩 → 로그인 → 연락처 목록 화면으로 구성되어 있습니다.

### 📝 기능 요약

* 카카오 스타일 / iOS 기본 테마 선택
* 테스트 계정 로그인 지원 (ID: 0000 / PW: 0000)
* 로그인 이후 연락처 목록 화면 (전화/채팅 기능 제공)

---

## 🔧 **빠른 시작**

### 1. 설치

```bash
npm install
```

### 2. 실행

```bash
npm start
# 또는
npx expo start
```

### 3. 모바일 접속

Expo Go 또는 iOS/Android 시뮬레이터에서 실행 가능

---

## 🙋 참고사항

* 이 프로젝트는 데모 용도로 단순 인증을 사용합니다.
* 실제 백엔드나 보안 로직은 포함되어 있지 않습니다.
* 네트워크 구성에 따라 `npm install`이 필요할 수 있습니다.

---

# 👨‍💻 **팀 유성구 해바라기**

<table>
	<thead>
		<tr>
		<th align="center"><strong>김아린</strong></th>
		<th align="center"><strong>손병수</strong></th>
		<th align="center"><strong>박서현</strong></th>
		<th align="center"><strong>김예성</strong></th>
		<th align="center"><strong>유동훈</strong></th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td align="center"><a href="https://github.com/ArinKim"><img src="https://github.com/ArinKim.png" height="150" width="150"> <br> @ArinKim</a></td>
			<td align="center"><a href="https://github.com/bottle-siu"><img src="https://github.com/bottle-siu.png" height="150" width="150"> <br> @bottle-siu</a></td>
			<td align="center"><a href="https://github.com/sseooh"><img src="https://github.com/sseooh.png" height="150" width="150"> <br> @sseooh</a></td>
			<td align="center"><a href="https://github.com/Y-eseong"><img src="https://github.com/Y-eseong.png" height="150" width="150"> <br> @Y-eseong</a></td>
			<td align="center"><a href="https://github.com/dbehdgns1215"><img src="https://github.com/dbehdgns1215.png" height="150" width="150"> <br> @dbehdgns1215</a></td>
		</tr>
	</tbody>
</table>

---
