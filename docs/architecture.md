# 아키텍처 (Architecture)

## 시스템 개요

Web Fact Checker는 Chrome Extension (Manifest V3) 기반 팩트체크 확장 프로그램입니다.
웹 페이지의 본문을 Readability로 추출하여 LLM API(OpenAI/Claude/Gemini)로 분석하고,
신뢰도 점수와 판정 레이블을 팝업 UI에 표시합니다.

## 기술 스택

| 계층 | 기술 | 비고 |
|------|------|------|
| 확장 프레임워크 | Chrome Extension MV3 | ES Module Service Worker |
| 빌드 | Vite 8 + @crxjs/vite-plugin 2.x | TypeScript bundler |
| 언어 | TypeScript 6.0 (strict) | ES2023 target, verbatimModuleSyntax |
| UI | Vanilla TypeScript + Pico CSS | 경량 classless CSS 프레임워크 |
| 본문 추출 | @mozilla/readability | Firefox Readability 포트 |
| 스토리지 | chrome.storage.local | MV3 Service Worker 호환 |
| 외부 API | OpenAI / Claude / Gemini | 사용자 선택, API 키 직접 입력 |

## 디렉토리 구조

```
src/
├── background.ts              # Service worker: 메시지 라우팅, LLM API 호출
├── content.ts                 # Content script: 본문 추출, 하이라이트
├── popup/                     # 팝업 UI
│   ├── index.html
│   ├── main.ts                # 진입점, 뷰 라우팅
│   ├── styles.css             # Pico CSS 커스텀
│   ├── views/
│   │   ├── analyze-view.ts    # 분석 실행/결과
│   │   ├── settings-view.ts   # API 키 설정
│   │   └── history-view.ts    # 분석 내역
│   └── components/
│       ├── result-card.ts
│       ├── score-badge.ts
│       └── provider-selector.ts
├── core/                      # 공통 계층
│   ├── types.ts               # 모든 타입 정의
│   ├── messages.ts            # 메시지 프로토콜
│   └── constants.ts           # 상수
├── analysis/                  # 분석 엔진
│   ├── extractor.ts           # Readability 본문 추출 (content 측)
│   ├── analyzer.ts            # LLM 호출/파싱 (background 측)
│   └── providers/
│       ├── interface.ts       # LLMProvider 공통 인터페이스
│       ├── openai.ts
│       ├── claude.ts
│       └── gemini.ts
├── storage/                   # 데이터 저장
│   ├── settings-store.ts      # 설정 저장/조회
│   └── history-store.ts       # 분석 결과 저장/조회
└── utils/
    ├── dom.ts                 # DOM 유틸리티
    └── format.ts              # 포맷팅
```

## 메시지 프로토콜

### Popup ↔ Background (chrome.runtime)

```
Popup → Background:
  ANALYZE_PAGE      → 분석 요청
  GET_HISTORY       → 분석 내역 요청
  GET_RESULT        → 특정 결과 조회
  SAVE_SETTINGS     → 설정 저장
  GET_SETTINGS      → 설정 조회
  DELETE_RESULT     → 결과 삭제
  EXPORT_RESULT     → 결과 내보내기
  GET_PROVIDERS     → Provider 목록 조회

Background → Popup:
  ANALYSIS_COMPLETE → 분석 완료
  ANALYSIS_ERROR   → 분석 실패
  HISTORY_DATA     → 내역 데이터
  RESULT_DATA      → 특정 결과
  SETTINGS_DATA    → 설정 데이터
  EXPORT_DATA      → 내보내기 데이터
  PROVIDERS_LIST   → Provider 목록
```

### Background ↔ Content (chrome.tabs.sendMessage)

```
Background → Content:
  APPLY_HIGHLIGHTS  → 하이라이트 적용
  CLEAR_HIGHLIGHTS  → 하이라이트 제거

Content → Background:
  SELECTION_TEXT    → 사용자 선택 영역 텍스트
```

### Popup → Content (직접, tabs.sendMessage)

```
Popup → Content:
  GET_SELECTION     → 현재 선택 영역 텍스트 요청
```

## 컴포넌트 상세

### Background Service Worker
- **파일**: `src/background.ts`
- **역할**: 중앙 메시지 버스, LLM API 호출, 데이터 CRUD
- **특성**: 비영속적 실행, chrome.storage.local로 상태 유지
- **주요 로직**: 메시지 타입별 라우팅 → Provider 호출 → 결과 저장/전달

### Content Script
- **파일**: `src/content.ts`
- **역할**: 웹 페이지 내 본문 추출, 하이라이트 시각화
- **주입 방식**: `<all_urls>`, `document_idle`
- **DOM 영향**: 복제된 DOM에서 Readability 실행, 원본 페이지 변경 최소화

### Popup
- **파일**: `src/popup/`
- **역할**: 사용자 인터페이스, 분석 요청/결과 조회/설정 관리
- **크기**: ~400x600px 기본 팝업

## 보안 고려사항

| 항목 | 적용 |
|------|------|
| API 키 | chrome.storage.local에 저장 (확장 내에서만 접근 가능) |
| CSP | Manifest V3 기본 CSP 유지, 필요시 API 도메인만 허용 |
| 권한 | activeTab + scripting (최소 권한 원칙) |
| 프롬프트 인젝션 | 프롬프트 템플릿에 구분자로 사용자 입력 격리 |
| 데이터 | 분석 결과는 로컬에만 저장, 외부 전송 없음 |

## 확장성

- **Provider 추가**: `LLMProvider` 인터페이스 구현체만 추가
- **분석 파이프라인**: 전처리/후처리 단계 추가 가능
- **설정 확장**: `AppSettings` 인터페이스 확장으로 새 설정 항목 추가
