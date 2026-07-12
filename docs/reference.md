# 레퍼런스 (Reference)

## 문서 색인

### 루트 문서
| 문서 | 설명 |
|------|------|
| `README.md` | 프로젝트 소개, 설치, 사용법 |
| `AGENTS.md` | 작업 규칙 (Phase 순차 실행, 보고 규칙) |

### 아키텍처 문서 (`docs/`)
| 문서 | 설명 |
|------|------|
| `architecture.md` | 시스템 개요, 디렉토리 구조, 메시지 프로토콜, 컴포넌트 |
| `reference.md` | (현재 문서) 문서 색인, 용어집, 규약 |

### 도메인 문서 (`docs/domains/`)
| 문서 | 설명 |
|------|------|
| `README.md` | 도메인 문서 인덱스, 경계 맵 |
| `domain-model.md` | 도메인 모델, 유비쿼터스 언어, 엔티티/값 객체 |
| `analysis-pipeline.md` | 분석 흐름, 청크 분할, 재시도 정책, 에지 케이스 |
| `credibility-model.md` | 신뢰도 판정 기준, 점수 산정, 레이블, 프롬프트 설계 |

## 용어집 (Glossary)

| 용어 | 영문 | 설명 |
|------|------|------|
| 팩트체크 | Fact Check | 웹 페이지 정보의 사실 여부 검증 |
| 신뢰도 점수 | Credibility Score | 0.0~1.0 범위의 사실 신뢰도 |
| 판정 레이블 | Fact Label | true / mostly_true / unverified / mostly_false / false / opinion |
| 본문 추출 | Content Extraction | Readability로 HTML에서 순수 텍스트 추출 |
| 하이라이트 | Highlight | 점수 기반 문장 색상 표시 |
| 분석 내역 | Analysis History | chrome.storage.local에 저장된 분석 결과 목록 |
| LLM Provider | LLM Provider | OpenAI / Claude / Gemini 등 외부 AI 모델 서비스 |
| Service Worker | Service Worker | MV3의 백그라운드 스크립트 (비영속적) |
| Content Script | Content Script | 웹 페이지에 주입되어 DOM에 접근하는 스크립트 |
| 청크 | Chunk | LLM 컨텍스트 제한을 고려한 텍스트 분할 단위 |

## 개발 규약 요약

### TypeScript
- `verbatimModuleSyntax` → `import type` 사용
- `noUnusedLocals`, `noUnusedParameters` → 사용하지 않는 코드 금지
- `erasableSyntaxOnly` → 타입 전용 syntax 사용
- `as any`, `@ts-ignore`, `@ts-expect-error` 금지

### 코드 스타일
- Prettier (VSCode 기본 포매터)
- ESLint 미설치 (린트 없음 — TypeScript compiler가 대체)
- 주석 없음 (AGENTS.md 규칙)

### UI
- 모든 사용자 메시지는 한국어
- Pico CSS classless 접근법: HTML 시맨틱 태그에 기본 스타일 적용
- 팝업 크기: ~400x600px

### 데이터
- chrome.storage.local 사용 (storage.session, storage.sync 사용 안함)
- 분석 결과 키: `result_{id}`
- 히스토리 인덱스 키: `history_index`
- 설정 키: `settings`
- 최대 히스토리 보관: 50개

### Git
- 커밋은 명시적 승인 필요
- Phase 단위로 커밋 (Phase 완료마다 1 커밋)
- 자동 커밋 금지

## 외부 의존성

| 패키지 | 용도 | 버전 |
|--------|------|------|
| @mozilla/readability | 웹 페이지 본문 추출 | 최신 |
| @picocss/pico | 경량 CSS 프레임워크 | 최신 |
| @crxjs/vite-plugin | Chrome Extension Vite 빌드 | ^2.7.1 |
| @types/chrome | Chrome API 타입 정의 | ^0.2.2 |

### 런타임 의존성 없음
브라우저 내장 API(chrome.*, fetch)와 Readability만으로 동작하므로
실행 시 추가 패키지 로드 불필요.
