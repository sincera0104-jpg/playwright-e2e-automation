import { test, expect } from '@playwright/test';
import { createUser, createArticle, getArticle } from './api/realworld-api';

test('UI에서 수정한 게시글이 API 데이터에 반영된다', async ({ request, page }) => {

    // Arrange: 테스트 데이터 준비 
    const timestamp = Date.now();
    const username = `qa-user-${timestamp}`;
    const email = `qa-${timestamp}@example.com`;
    const password = 'Test1234!';

    const userbody = await createUser(
        request,
        username,
        email,
        password
    );

    const token = userbody.user.token;

    const articleBody = await createArticle(
        request,
        token,
        `Playwright E2E Test ${timestamp}`,
        'Created by Playwright API',
        'This article was created for E2E automation testing.',
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

    const updatedBody = 'This article was updated through the UI.';

    await page
        .getByPlaceholder('Write your article (in markdown)')
        .fill(updatedBody);

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
    expect(finalBody.article.body).toBe(updatedBody);
}); 