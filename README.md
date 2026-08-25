# Playwright E2E Automation

Playwright + TypeScript를 활용해 **API와 UI를 결합한 E2E 테스트 자동화**를 구현한 프로젝트입니다.

단순 UI 동작 자동화보다 테스트 목적에 따라 API와 UI의 역할을 구분하고, 사용자 행동 전후의 데이터 상태까지 검증하는 테스트 구조를 구현하는데 초점을 두었습니다.

## 테스트 시나리오

RealWorld(Conduit) 서비스를 대상으로 다음 흐름을 자동화했습니다.

```text
API로 테스트 사용자 생성
        ↓
API로 테스트 게시글 생성
        ↓
UI에서 로그인
        ↓
API로 생성한 게시글 노출 확인
        ↓
UI에서 게시글 수정
        ↓
API로 최종 데이터 상태 검증
```

### 1. API로 테스트 데이터 준비

Playwright의 `APIRequestContext`를 사용해 테스트에 필요한 사용자와 게시글을 API로 생성합니다.

매 실행마다 timestamp 기반의 고유한 데이터를 생성해 기존 테스트 데이터와의 충돌을 방지합니다.

### 2. UI에서 생성 데이터 검증

API 응답으로 받은 `slug`, `title`, `body`를 활용해 해당 게시글 상세 페이지에 접근하고 실제 UI 노출 여부를 검증합니다.

```ts
await page.goto(`/article/${slug}`);

await expect(
  page.getByRole('heading', { name: title })
).toBeVisible();

await expect(
  page.getByText(articleText)
).toBeVisible();
```

### 3. UI에서 데이터 변경

사용자 시나리오에 따라 게시글 편집 화면에서 본문을 수정합니다.

편집 데이터가 로딩된 것을 확인한 후 UI 동작을 수행해 비동기 데이터 로딩으로 인한 테스트 불안정성을 방지합니다.

```ts
await expect(
  page.getByPlaceholder('Article Title')
).toHaveValue(title);
```

### 4. API로 최종 상태 검증

UI에서 수행한 변경이 화면에 표시되는 것만 확인하지 않고, API를 통해 데이터를 다시 조회해 서버에 실제로 반영되었는지 검증합니다.

```ts
expect(finalBody.article.body).toBe(updatedBody);
```

이를 통해 **사용자 행동과 최종 데이터 상태를 하나의 E2E 시나리오에서 검증**합니다.

## 기술 스택

* Playwright
* TypeScript
* Node.js
* REST API
* Git / GitHub

## 테스트 설계 방향

### API와 UI의 역할 분리

테스트 데이터 준비와 최종 상태 확인은 API를 활용하고, 실제 사용자 행동 검증이 필요한 영역은 UI를 활용합니다.

```text
API → 사전조건 및 테스트 데이터 준비
UI  → 사용자 관점의 노출 및 동작 검증
API → 변경 후 최종 데이터 상태 검증
```

UI에서 모든 사전조건을 만드는 방식보다 테스트 실행 단계를 줄이고, UI 결과뿐 아니라 서버 데이터까지 확인할 수 있도록 설계했습니다.

### 독립적인 테스트 데이터

테스트 실행 시 timestamp를 이용해 고유한 사용자와 게시글을 생성합니다.

```ts
const timestamp = Date.now();

const username = `qa-user-${timestamp}`;
const email = `qa-${timestamp}@example.com`;
```

반복 실행 시 기존 데이터와 충돌하지 않도록 테스트 데이터의 독립성을 확보했습니다.

### 안정적인 UI 동기화

고정된 대기 시간을 사용하는 대신 Playwright의 assertion과 auto-waiting을 활용해 실제 화면 상태를 기준으로 다음 동작을 수행합니다.

```ts
await expect(
  page.getByPlaceholder('Article Title')
).toHaveValue(title);
```

## 프로젝트 구조

```text
playwright-e2e-automation/
├── tests/
│   └── article-e2e.spec.ts
├── playwright.config.ts
├── package.json
└── README.md
```

## 실행 방법

### 의존성 설치

```bash
npm install
```

### Playwright 브라우저 설치

```bash
npx playwright install
```

### 테스트 실행

```bash
npx playwright test
```

### 브라우저에서 실행 과정 확인

```bash
npx playwright test --headed
```

### Playwright UI Mode

```bash
npx playwright test --ui
```

## 향후 개선

* API 요청 로직 모듈화
* UI 테스트 구조 리팩터링
* 테스트 데이터 cleanup 적용
* 인증 과정 최적화
* GitHub Actions 기반 CI 테스트 자동화
* 테스트 리포트 관리 개선

---

이 프로젝트는 UI 동작 자체를 자동화하는 것보다 **테스트 목적에 따라 API와 UI를 조합하고, 사용자 행동 전후의 데이터 상태까지 검증하는 E2E 자동화 구조를 설계하는 것**을 목표로 합니다.
