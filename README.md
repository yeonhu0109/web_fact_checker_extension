# Web Fact Checker — Chrome Extension

웹 페이지의 콘텐츠를 분석하여 사실 여부를 검증하는 Chrome 확장 프로그램입니다.

## 기능

- **페이지 본문 분석**: 방문 중인 웹 페이지의 주요 콘텐츠를 Readability로 추출하여 분석
- **LLM 기반 팩트체크**: OpenAI / Claude / Gemini 등 AI 모델로 문장별 사실 여부 판정
- **신뢰도 점수**: 0.0~1.0 범위의 점수와 6단계 레이블(true ~ opinion)로 결과 표시
- **다중 Provider 지원**: 사용자가 원하는 LLM Provider를 선택하여 사용
- **분석 내역**: 이전 분석 결과를 저장하고 언제든 다시 확인
- **결과 내보내기**: 분석 결과를 JSON 또는 텍스트 파일로 내보내기

## 설치

### 로컬 개발 환경

```bash
# 저장소 클론
git clone <repository-url>
cd web-fact-checker-extension-main

# 의존성 설치
npm install

# 개발 서버 실행 (HMR + 확장 프로그램 자동 로드)
npm run dev

# 프로덕션 빌드
npm run build
```

### Chrome 확장 프로그램 로드

1. `npm run build` 실행
2. Chrome 주소창에 `chrome://extensions` 입력
3. 우측 상단 "개발자 모드" 활성화
4. "압축해제된 확장 프로그램을 로드합니다" 클릭
5. `dist/` 폴더 선택

## 사용법

1. 분석하려는 웹 페이지로 이동
2. 확장 프로그램 아이콘 클릭하여 팝업 열기
3. 처음 사용 시 설정(⚙️)에서 API 키 입력:
   - OpenAI / Claude / Gemini 중 선택
   - 해당 서비스의 API 키 입력
   - 모델 선택 (각 Provider별 기본 모델 제공)
4. "분석 시작" 버튼 클릭
5. 분석 완료 후 문장별 신뢰도 점수와 판정 레이블 확인
6. 분석 내역(📋)에서 이전 결과 조회 및 내보내기 가능

## 기술 스택

| 구성 | 기술 |
|------|------|
| 확장 프레임워크 | Chrome Extension Manifest V3 |
| 빌드 | Vite + @crxjs/vite-plugin |
| 언어 | TypeScript (strict mode) |
| UI | Vanilla TypeScript + Pico CSS |
| 본문 추출 | @mozilla/readability |
| 스토리지 | chrome.storage.local |
| 외부 API | OpenAI / Claude / Gemini |

## 프로젝트 구조

```
src/
├── background.ts      # Service Worker (메시지 라우팅, LLM 호출)
├── content.ts         # Content Script (본문 추출, 하이라이트)
├── popup/             # 팝업 UI
├── core/              # 공통 타입, 메시지 프로토콜
├── analysis/          # 분석 엔진, LLM Provider 어댑터
├── storage/           # chrome.storage.local 데이터 계층
└── utils/             # 유틸리티
docs/                  # 아키텍처 및 도메인 문서
```

## 라이선스

MIT
