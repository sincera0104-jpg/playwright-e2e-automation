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

let token: string;

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

test('UI에서 수정한 게시글이 API 데이터에 반영된다', async ({ request, page }) => {

    // Arrange: 테스트 데이터 준비 
    const timestamp = Date.now();
    const password = TEST_PASSWORD;

    const articleBody = await createArticle(
        request,
        token,
        `Playwright E2E Test ${timestamp}`,
        ARTICLE_DESCRIPTION,
        ARTICLE_BODY,
        ['playwright', 'e2e']
    );

    const slug = articleBody.article.slug;
    const title = articleBody.article.title;
    const articleText = articleBody.article.body;

    // Act: UI에서 게시글 확인 및 수정 
    // API에서 발급받은 token으로 브라우저 인증 상태 설정
    await page.addInitScript(token => {
        localStorage.setItem('jwtToken', token);
    }, token);

    await page.goto(`/article/${slug}`);

    await expect(page.getByRole('heading', { name: title })).toBeVisible();
    await expect(page.getByText(articleText)).toBeVisible();

    await page.getByRole('link', { name: 'Edit Article' }).first().click();

    await expect(page.getByPlaceholder('Article Title')).toHaveValue(title);

    await page
        .getByPlaceholder('Write your article (in markdown)')
        .fill(UPDATED_ARTICLE_BODY);

    // UI에서 발생한 게시글 수정 API가 정상 처리되는지 검증 
    const updateResponsePromise = page.waitForResponse(
        response =>
            response.url().includes(`/api/articles/${slug}`) &&
            response.request().method() === 'PUT'
    );

    await page.getByRole('button', { name: 'Publish Article' }).click();

    const updateResponse = await updateResponsePromise;

    expect(updateResponse.status()).toBe(200);

    // Assert: API로 최종 상태 검증 
    const finalBody = await getArticle(
        request,
        token,
        slug
    );

    // 수정한 게시글과 API로 조회한 게시글이 일치하는지 검증 
    expect(finalBody.article.body).toBe(UPDATED_ARTICLE_BODY);

    // Cleanup: 테스트 데이터 삭제
    await deleteArticle(request, token, slug);
}); 

test('UI에서 삭제한 게시글이 API에서도 존재하지 않는다', async ({ request, page }) => {
  // Arrange: 테스트 데이터 준비
  const timestamp = Date.now();

  const articleBody = await createArticle(
    request,
    token,
    `Delete E2E Test ${timestamp}`,
    ARTICLE_DESCRIPTION,
    ARTICLE_BODY,
    ['playwright', 'delete']
  );

  const slug = articleBody.article.slug;
  const title = articleBody.article.title;

  // API token으로 브라우저 인증 상태 설정
  await page.addInitScript(token => {
    localStorage.setItem('jwtToken', token);
  }, token);

  // Act: UI에서 게시글 삭제
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

  // Assert: API에서 게시글이 실제로 삭제됐는지 검증
  await expectArticleNotFound(
    request,
    token,
    slug
  );
});