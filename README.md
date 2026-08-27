# Playwright E2E Automation

Playwright + TypeScript를 활용한 **API + UI E2E 테스트 자동화 프로젝트**입니다.

모든 과정을 UI로 자동화하기보다, 테스트 목적에 따라 API와 UI의 역할을 구분해 **테스트 실행 효율과 최종 데이터 검증**을 함께 고려했습니다.

## 테스트 시나리오

```text
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

테스트 목적은 **UI에서 수행한 게시글 수정이 실제 서버 데이터까지 정상 반영되는지 검증하는 것**입니다.

회원 및 게시글 생성은 테스트 수행을 위한 사전조건이므로 API로 준비하고, 실제 사용자 행동 검증이 필요한 게시글 확인 및 수정은 UI로 수행합니다.

## 테스트 설계

```text
Arrange
→ API로 사용자 및 게시글 생성

Act
→ UI에서 게시글 확인 및 수정
→ 수정 PUT API 응답 확인

Assert
→ API로 게시글 재조회
→ UI에서 수정한 값과 최종 서버 데이터 비교
```

UI에서 모든 사전조건을 만드는 대신 API를 활용해 테스트 단계를 줄이고, UI 결과뿐 아니라 실제 데이터 상태까지 검증합니다.

## 프로젝트 구조

```text
tests/
├── api/
│   └── realworld-api.ts
│       ├── createUser()
│       ├── createArticle()
│       └── getArticle()
│
└── article-e2e.spec.ts
```

API 요청 로직은 `realworld-api.ts`로 분리하고, `article-e2e.spec.ts`에서는 E2E 시나리오와 검증 흐름에 집중하도록 구성했습니다.

UI 기본 URL은 `playwright.config.ts`, API 기본 URL은 `realworld-api.ts`에서 관리합니다.

## 기술 스택

`Playwright` · `TypeScript` · `Node.js` · `REST API` · `GitHub`

## 실행

```bash
npm install
npx playwright install
npx playwright test
```

Chromium만 실행:

```bash
npx playwright test --project=chromium
```

브라우저 실행 과정을 확인하려면:

```bash
npx playwright test --headed
```

## Next

* 로그인 UI를 API 인증 기반으로 최적화
* 테스트 데이터 cleanup
* 테스트 시나리오 확장
* GitHub Actions CI 연동
