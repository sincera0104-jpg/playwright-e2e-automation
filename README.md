# Playwright E2E Automation

Playwright + TypeScript를 활용한 **API + UI E2E 테스트 자동화 프로젝트**입니다.

모든 과정을 UI로 자동화하기보다, 테스트 목적에 따라 API와 UI의 역할을 구분해 테스트 실행 효율과 검증 범위를 함께 고려했습니다.

## 테스트 시나리오

```text id="ozlzmz"
API 테스트 사용자 생성
        ↓
API 게시글 생성
        ↓
UI 로그인 및 게시글 노출 확인
        ↓
UI 게시글 수정
        ↓
API 최종 데이터 상태 검증
```

테스트의 핵심 목적은 **UI에서 수행한 게시글 수정이 실제 서버 데이터까지 정상 반영되는지 검증하는 것**입니다.

회원 및 게시글 생성은 테스트 수행을 위한 사전조건이므로 API로 준비하고, 실제 사용자 행동 검증이 필요한 영역은 UI를 사용했습니다.

## 테스트 설계

**API → 사전조건 준비**

* 테스트 사용자 생성
* 테스트 게시글 생성

**UI → 사용자 행동 검증**

* 로그인
* 생성된 게시글 노출 확인
* 게시글 수정

**API → 최종 상태 검증**

* 게시글 재조회
* UI에서 변경한 데이터의 서버 반영 여부 검증

이를 통해 UI에서 모든 사전조건을 만드는 방식보다 테스트 단계를 줄이고, 실패 원인 분석과 테스트 유지보수가 용이하도록 구성했습니다.

## 프로젝트 구조

```text id="g0vr4v"
tests/
├── api/
│   └── realworld-api.ts
│       ├── createUser()
│       ├── createArticle()
│       └── getArticle()
│
└── article-e2e.spec.ts
```

API 요청 로직을 `realworld-api.ts`로 분리하고, `article-e2e.spec.ts`에서는 E2E 시나리오와 검증 흐름에 집중하도록 리팩터링했습니다.

UI 기본 URL은 `playwright.config.ts`, API 기본 URL은 `realworld-api.ts`에서 각각 관리합니다.

## 기술 스택

`Playwright` · `TypeScript` · `Node.js` · `REST API` · `GitHub`

## 실행

```bash id="n9dl5v"
npm install
npx playwright install
npx playwright test
```

Chromium만 실행:

```bash id="oyid03"
npx playwright test --project=chromium
```

## Next

* 테스트 구조 및 네이밍 정리
* 인증 과정 최적화
* 테스트 데이터 cleanup
* GitHub Actions CI 연동
