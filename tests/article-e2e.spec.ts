import { test, expect, request as playwrightRequest } from '@playwright/test';
import {
  createUser,
  createArticle,
  getArticle,
  deleteArticle,
  expectArticleNotFound
} from './api/realworld-api';

const TEST_PASSWORD = 'Test1234!';

const ARTICLE_DESCRIPTION = 'Created by Playwright API';
const ARTICLE_BODY = 'This article was created for E2E automation testing.';
const UPDATED_ARTICLE_BODY = 'This article was updated through the UI.';

const REQUIRED_FIELD_CASES = [
  {
    field: 'title',
    label: '제목',
    expectedMessage: "title can't be blank",
  },
  {
    field: 'description',
    label: '설명',
    expectedMessage: "description can't be blank",
  },
  {
    field: 'body',
    label: '본문',
    expectedMessage: "body can't be blank",
  },
] as const;

let token: string;

// 두 테스트가 같은 파일 안에서 한 worker에서 순서대로 실행되도록 하기 위한 설정
test.describe.configure({ mode: 'default' });

test.beforeAll(async () => {
  const apiContext = await playwrightRequest.newContext();

  const timestamp = Date.now();
  const username = `qa-user-${timestamp}`;
  const email = `qa-${timestamp}@example.com`;

  const userBody = await createUser(
    apiContext,
    username,
    email,
    TEST_PASSWORD
  );

  token = userBody.user.token;

  await apiContext.dispose();
});

// API에서 발급받은 token으로 브라우저 인증 상태 설정
test.beforeEach(async ({ page }) => {
  await page.addInitScript(token => {
    localStorage.setItem('jwtToken', token);
  }, token);
});

test('UI에서 수정한 게시글이 API 데이터에 반영된다', async ({ request, page }) => {

  // Arrange
  const { slug, title, articleText } = await test.step(
    '게시글 테스트 데이터 생성',
    async () => {
      const timestamp = Date.now();

      const articleBody = await createArticle(
        request,
        token,
        `Playwright E2E Test ${timestamp}`,
        ARTICLE_DESCRIPTION,
        ARTICLE_BODY,
        ['playwright', 'e2e']
      );

      return {
        slug: articleBody.article.slug,
        title: articleBody.article.title,
        articleText: articleBody.article.body,
      };
    }
  );

  // Act
  await test.step('UI에서 게시글 확인 및 수정', async () => {
    await page.goto(`/article/${slug}`);

    await expect(
      page.getByRole('heading', { name: title })
    ).toBeVisible();

    await expect(
      page.getByText(articleText)
    ).toBeVisible();

    await page
      .getByRole('link', { name: 'Edit Article' })
      .first()
      .click();

    await expect(
      page.getByPlaceholder('Article Title')
    ).toHaveValue(title);

    await page
      .getByPlaceholder('Write your article (in markdown)')
      .fill(UPDATED_ARTICLE_BODY);

    const updateResponsePromise = page.waitForResponse(
      response =>
        response.url().includes(`/api/articles/${slug}`) &&
        response.request().method() === 'PUT'
    );

    await page
      .getByRole('button', { name: 'Publish Article' })
      .click();

    const updateResponse = await updateResponsePromise;

    expect(updateResponse.status()).toBe(200);
  });

  // Assert
  await test.step('API로 최종 데이터 검증', async () => {
    const finalBody = await getArticle(
      request,
      token,
      slug
    );

    expect(finalBody.article.body).toBe(UPDATED_ARTICLE_BODY);
  });

  // Cleanup
  await test.step('테스트 데이터 정리', async () => {
    await deleteArticle(request, token, slug);
  });
});

test('UI에서 삭제한 게시글이 API에서도 존재하지 않는다', async ({ request, page }) => {

  // Arrange
  const { slug, title } = await test.step(
    '게시글 테스트 데이터 생성',
    async () => {
      const timestamp = Date.now();

      const articleBody = await createArticle(
        request,
        token,
        `Delete E2E Test ${timestamp}`,
        ARTICLE_DESCRIPTION,
        ARTICLE_BODY,
        ['playwright', 'delete']
      );

      return {
        slug: articleBody.article.slug,
        title: articleBody.article.title,
      };
    }
  );

  // Act
  await test.step('UI에서 게시글 삭제', async () => {
    await page.goto(`/article/${slug}`);

    await expect(
      page.getByRole('heading', { name: title })
    ).toBeVisible();

    const deleteResponsePromise = page.waitForResponse(
      response =>
        response.url().includes(`/api/articles/${slug}`) &&
        response.request().method() === 'DELETE'
    );

    await page
      .getByRole('button', { name: 'Delete Article' })
      .first()
      .click();

    const deleteResponse = await deleteResponsePromise;

    expect(deleteResponse.status()).toBe(204);
  });

  // Assert
  await test.step('API로 삭제 결과 검증', async () => {
    await expectArticleNotFound(
      request,
      token,
      slug
    );
  });
});

test('UI에서 생성한 게시글이 API 데이터에 정상 반영된다', async ({ request, page }) => {
  const timestamp = Date.now();
  const title = `Create E2E Test ${timestamp}`;

  const slug = await test.step('UI에서 게시글 생성', async () => {
    await page.goto('/editor');

    await page
      .getByPlaceholder('Article Title')
      .fill(title);

    await page
      .getByPlaceholder("What's this article about?")
      .fill(ARTICLE_DESCRIPTION);

    await page
      .getByPlaceholder('Write your article (in markdown)')
      .fill(ARTICLE_BODY);

    const createResponsePromise = page.waitForResponse(
      response =>
        response.url().includes('/api/articles') &&
        response.request().method() === 'POST'
    );

    await page
      .getByRole('button', { name: 'Publish Article' })
      .click();

    const createResponse = await createResponsePromise;

    expect(createResponse.status()).toBe(201);

    const responseBody = await createResponse.json();

    return responseBody.article.slug;
  });

  await test.step('API로 생성 결과 검증', async () => {
    const finalBody = await getArticle(
      request,
      token,
      slug
    );

    expect(finalBody.article.title).toBe(title);
    expect(finalBody.article.description).toBe(ARTICLE_DESCRIPTION);
    expect(finalBody.article.body).toBe(ARTICLE_BODY);
  });

  await test.step('테스트 데이터 정리', async () => {
    await deleteArticle(request, token, slug);
  });
});

for (const testCase of REQUIRED_FIELD_CASES) {
  test(`게시글 ${testCase.label}이 비어 있으면 생성되지 않는다`, async ({ page }) => {
    const timestamp = Date.now();
    const title = `Negative E2E Test ${timestamp}`;

    await test.step(`${testCase.label} 없이 게시글 생성 시도`, async () => {
      await page.goto('/editor');

      if (testCase.field !== 'title') {
        await page
          .getByPlaceholder('Article Title')
          .fill(title);
      }

      if (testCase.field !== 'description') {
        await page
          .getByPlaceholder("What's this article about?")
          .fill(ARTICLE_DESCRIPTION);
      }

      if (testCase.field !== 'body') {
        await page
          .getByPlaceholder('Write your article (in markdown)')
          .fill(ARTICLE_BODY);
      }

      const createResponsePromise = page.waitForResponse(
        response =>
          response.url().includes('/api/articles') &&
          response.request().method() === 'POST'
      );

      await page
        .getByRole('button', { name: 'Publish Article' })
        .click();

      const createResponse = await createResponsePromise;

      expect(createResponse.status()).toBe(422);
    });

    await test.step('필수값 validation 에러 확인', async () => {
      await expect(
        page.getByText(testCase.expectedMessage)
      ).toBeVisible();

      await expect(page).toHaveURL(/\/editor/);
    });
  });
}