import { test, expect } from '@playwright/test';
import { createUser, createArticle, getArticle } from './api/realworld-api';

test('UI에서 수정한 게시글이 API 데이터에 반영된다', async ({ request, page }) => {

    // API로 사용자 생성 (post /api/users)
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

    // API로 게시글 생성 (post /api/articles)
    const articleBody = await createArticle(
        request,
        token,
        `Playwright E2E Test ${timestamp}`,
        'Created by Playwright API',
        'This article was created for E2E automation testing.',
        ['playwright', 'e2e']
    );

    console.log('게시글 생성 응답', articleBody);

    const slug = articleBody.article.slug;
    const title = articleBody.article.title;
    const articleText = articleBody.article.body;

    // API로 생성한 게시글을 보기 위해 로그인 
    await page.goto('/login');

    await page.getByPlaceholder('Email').fill(email);
    await page.getByPlaceholder('Password').fill(password);
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByText(username)).toBeVisible();

    // API로 생성한 게시글이 UI에서 확인되는지 검증 
    await page.goto(`/article/${slug}`);

    await expect(page.getByRole('heading', { name: title })).toBeVisible();
    await expect(page.getByText(articleText)).toBeVisible();

    // UI에서 게시글 수정 테스트 
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

    //console.log('게시글 수정 status:', updateResponse.status());
    //console.log('게시글 수정 응답:', await updateResponse.json());

    // API로 게시글 조회 
    const finalBody = await getArticle(
        request,
        token,
        slug
    );

    // 수정한 게시글과 API로 조회한 게시글이 일치하는지 검증 
    expect(finalBody.article.body).toBe(updatedBody);
}); 