---
slug: architecture-design
status: drafting
intent: clear
pending-action: write .omo/plans/architecture-design.md
approach: <fill: the approach you intend to plan>
---

# Draft: architecture-design

## Components (topology ledger)
| id | outcome | status | evidence path |
|----|---------|--------|--------------|
| C1 - Content extraction | Readability로 페이지 본문 추출 | active | User decision: "Readability 등을 사용하여 페이지 본문 자동추출" |
| C2 - Analysis logic | 여러 LLM Provider(OpenAI/Claude/Gemini) 지원 API 호출 | active | User decision: "사용자 선택 가능 (여러 Provider)" |
| C3 - Popup UI | Vanilla TS + Pico CSS, 팝업 전용 결과 표시 | active | User decision: "vanila typescript에 추가로 pico css", "팝업 전용" |
| C4 - Storage/History | chrome.storage.local로 분석 내역 및 결과 저장 | active | User decision: "chrome.storage.local", "분석 내역 보기" |
| C5 - API key management | chrome.storage.local에 API 키 저장, 설정 UI 제공 | active | User decision: "API 키 설정 UI" |
| C6 - Export | 분석 결과 JSON/텍스트 내보내기 | active | User decision: "분석 결과 내보내기" |
| C7 - Background service worker | 메시지 라우팅, 분석 요청 중개 | active | Required by MV3 architecture |

## Open assumptions (announced defaults)
| assumption | adopted default | rationale | reversible? |
|------------|----------------|-----------|-------------|
| CSS 프레임워크 | Pico CSS (classless, 10KB) | 사용자 지정 | Yes |
| Readability 라이브러리 | @mozilla/readability | 표준 라이브러리, 유지보수 활발 | Yes |
| LLM API 통신 | background.ts에서 fetch 직접 호출 | MV3 Service Worker에서 fetch 가능 | Yes |
| Provider 추상화 | 공통 인터페이스로 Provider별 adapter 패턴 | 확장성 | Yes |
| 분석 결과 저장 | chrome.storage.local + URL 기반 키 | 영구 저장, URL로 중복 방지 | Yes |
| 내보내기 형식 | JSON (원본 데이터) + 텍스트 요약 | 포트폴리오 수준 | Yes |
| 배포 | 로컬 설치 (chrome://extensions > 개발자모드) | 사용자 지정 | Yes |

## Findings (cited - path:lines)
- `src/background.ts:1` - Service worker 스켈레톤 (console.log만 있음)
- `src/content.ts:1` - Content script 스켈레톤 (console.log만 있음)
- `src/popup/index.html:1-12` - HTML 팝업, lang="en", 현재 "Extension Ready" 표시
- `src/popup/main.ts:1-3` - 팝업 스켈레톤 (DOMContentLoaded만 있음)
- `manifest.json:1-22` - MV3, permissions: activeTab+scripting, host_permissions: <all_urls>
- `tsconfig.json:1-24` - 엄격 모드, verbatimModuleSyntax, ES2023 target
- `vite.config.ts:1-7` - @crxjs/vite-plugin 사용
- `AGENTS.md` - 한국어 UI 규칙, Phase 순차 실행 규칙

## Decisions (with rationale)
1. **LLM Provider 추상화**: 여러 Provider 지원을 위해 공통 인터페이스 정의. 각 Provider adapter에서 API 형식 차이를 캡슐화.
2. **팝업 Archive 뷰**: 분석 내역 보기를 위해 팝업 내에서 리스트/상세 뷰 전환 (별도 페이지 불필요)
3. **배치 분석**: 페이지 본문을 적절한 청크(토큰 제한 고려)로 분할하여 LLM 요청
4. **커스텀 프롬프트**: 사실성 확인 + 근거 제시 + 신뢰도 점수 포함

## Scope IN
- 웹 페이지 본문 추출 (Readability)
- LLM API 연동 (OpenAI/Claude/Gemini — 사용자 선택)
- 팝업 UI: 분석 실행, 결과 표시, API 키 관리, 분석 내역, 내보내기
- chrome.storage.local 기반 데이터 저장
- 페이지 내 팩트 의심 문장 하이라이트 (content script)
- 분석 결과 JSON/텍스트 내보내기

## Scope OUT (Must NOT have)
- 자체 백엔드 서버 구축
- 사용자 로그인/계정 시스템
- 실시간 협업 기능
- 복잡한 차트/시각화
- 브라우저 간 동기화
- 자동 분석 모드 (사용자 트리거 방식)
- chrome.storage.sync 사용 (local로 통일)

## Approval gate
status: awaiting-approval
<!-- When exploration is exhausted and unknowns are answered, set status: awaiting-approval. -->
<!-- That durable record is the loop guard: on a later turn read it and resume at the gate instead of re-running exploration. -->
