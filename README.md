# Playwright E2E Automation

![Playwright E2E Tests](https://github.com/sincera0104-jpg/playwright-e2e-automation/actions/workflows/playwright.yml/badge.svg?branch=main)

Playwright + TypeScript를 활용한 **API + UI E2E 테스트 자동화 프로젝트**입니다.

모든 과정을 UI로 자동화하기보다, 테스트 목적에 따라 API와 UI의 역할을 구분해 **테스트 실행 효율과 최종 데이터 검증**을 함께 고려했습니다.

## 테스트 시나리오

```text
공통 사전조건
→ API로 테스트 사용자 1회 생성
→ 각 테스트 시작 시 JWT Token으로 브라우저 인증 상태 설정

Create
→ UI에서 게시글 생성
→ POST /articles 201 응답 확인
→ API로 생성 데이터 재조회 및 검증
→ 성공한 테스트 게시글 삭제

Update
→ API로 게시글 생성
→ UI에서 게시글 수정
→ PUT /articles/{slug} 200 응답 확인
→ API로 수정 데이터 재조회 및 검증
→ 성공한 테스트 게시글 삭제

Delete
→ API로 게시글 생성
→ UI에서 게시글 삭제
→ DELETE /articles/{slug} 204 응답 확인
→ API 재조회 시 404 확인

Negative
→ 제목 없이 게시글 생성 시도
→ POST /articles 422 응답 확인
→ "title can't be blank" validation 메시지 확인
→ editor 화면 유지 확인
```

테스트 목적은 **UI에서 수행한 게시글 수정이 실제 서버 데이터까지 정상 반영되는지 검증하는 것**입니다.

회원 및 게시글 생성은 테스트 수행을 위한 사전조건이므로 API로 준비하고, 로그인 UI는 검증 대상이 아니므로 API에서 발급받은 인증 토큰을 브라우저에 직접 설정합니다.  

실제 사용자 행동 검증이 필요한 게시글 확인 및 수정은 UI로 수행하고, 수정 이후 API를 통해 최종 서버 데이터까지 검증합니다.  

테스트 파일 실행 시 `beforeAll`에서 테스트 사용자를 한 번 생성해 여러 시나리오에서 재사용하고, `beforeEach`에서 JWT 인증 상태를 설정해 반복되는 사전조건을 공통화했습니다.  

각 테스트는 `test.step()`으로 데이터 준비, UI 동작, API 검증, Cleanup 단계를 구분해 HTML Report에서 진행 단계와 실패 지점을 쉽게 확인할 수 있도록 구성했습니다.

## 테스트 설계

```text
Arrange
→ 공용 테스트 사용자 및 인증 상태 준비
→ 필요한 경우 API로 게시글 사전 생성

Act
→ UI에서 게시글 생성 / 수정 / 삭제 수행

Assert
→ UI 동작으로 발생한 POST / PUT / DELETE 응답 검증
→ API 재조회로 최종 서버 상태 검증
→ 네거티브 케이스에서는 422 응답과 validation 메시지 검증

Cleanup
→ 성공한 테스트 데이터 삭제
```

UI에서 모든 사전조건을 만드는 대신 API를 활용해 테스트 단계를 줄이고, UI 결과뿐 아니라 실제 데이터 상태까지 검증합니다.  

성공한 테스트의 게시글은 자동으로 삭제하며, 실패한 테스트 데이터는 원인 분석에 활용할 수 있도록 보존합니다.  

(사용자 재사용 & 인증 공통화)  
테스트 파일 실행 시 `beforeAll`에서 테스트 사용자를 한 번 생성해 여러 시나리오에서 재사용하고, `beforeEach`에서 JWT 인증 상태를 설정해 중복된 사전조건 코드를 최소화했습니다.  

(테스트 구조화)  
Playwright의 `test.step()`을 활용해 테스트 데이터 생성, UI 동작, API 검증, Cleanup 단계를 구분하여 HTML Report에서 테스트 진행 단계와 실패 지점을 쉽게 확인할 수 있도록 구성했습니다.  

## 프로젝트 구조

```text
tests/
├── api/
│   └── realworld-api.ts
│       ├── createUser()
│       ├── createArticle()
│       └── getArticle()
│       └── deleteArticle()
│
└── article-e2e.spec.ts

.github/ 
└── workflows/ 
    └── playwright.yml  

playwright.config.ts  
```

API 요청 로직은 `realworld-api.ts`로 분리하고, `article-e2e.spec.ts`에서는 E2E 시나리오와 검증 흐름에 집중하도록 구성했습니다.

UI 기본 URL은 `playwright.config.ts`, API 기본 URL은 `realworld-api.ts`에서 관리합니다.

GitHub Actions를 통해 `main` 브랜치의 Push 및 Pull Request 시 Chromium 환경에서 E2E 테스트가 자동 실행됩니다.

기본 URL은 환경변수로 관리하며, 로컬에서는 .env, CI에서는 GitHub Actions의 env를 통해 주입합니다.

## CI 및 테스트 리포트

GitHub Actions를 통해 `main` 브랜치의 Push 및 Pull Request 시 Chromium 환경에서 E2E 테스트를 자동 실행합니다.

테스트 실행 결과는 GitHub Actions artifact로 저장하며 **7일간 보관 후 자동 삭제**되도록 설정했습니다.

```text
PASS
→ Playwright HTML Report 저장

FAIL
→ Playwright HTML Report 저장
→ retry 시 Trace 등 test-results 저장
```

이를 통해 CI 실행 결과를 확인하고, 테스트 실패 시 Trace를 활용해 실패 지점과 브라우저 동작을 추적할 수 있도록 구성했습니다.

## 기술 스택

`Playwright` · `TypeScript` · `Node.js` · `REST API` · `GitHub Actions`

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
* 추가 네거티브 시나리오 확장
* 테스트 증가 시 Page Object Model 적용 검토
* 테스트 데이터 관리 전략 고도화

* API 요청 로직 분리 ✅
* UI / API baseURL 분리 ✅
* API 인증 기반으로 로그인 최적화 ✅
* 테스트 데이터 cleanup 추가 ✅
* 테스트 데이터 상수 분리 ✅
* Playwright  테스트 리포트 artifact 추가 ✅
* UI/API 환경변수 분리 ✅