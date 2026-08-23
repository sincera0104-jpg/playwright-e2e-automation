import { test, expect } from '@playwright/test';

test('API로 생성한 게시글을 UI에서 확인', async ({ request, page }) => {

// API로 사용자 생성 (post /api/users)
  const timestamp = Date.now();
  const username = `qa-user-${timestamp}`;
  const email = `qa-${timestamp}@example.com`;
  const password = 'Test1234!';

  const response = await request.post(
    'https://api.realworld.show/api/users',
    {
      data: {
        user: {
          username,
          email,
          password,
        },
      },
    }
  );

  expect(response.status()).toBe(201);

  const body = await response.json();
  // console.log('사용자 생성 응답', body);

  const token = body.user.token;

// API로 게시글 생성 (post /api/articles)
// Authorization 헤더에 토큰을 포함하여 요청
const articleResponse = await request.post(
  'https://api.realworld.show/api/articles',
  {
    headers: {
      Authorization: `Token ${token}`,
    },
    data: {
      article: {
        title: `Playwright E2E Test ${timestamp}`,
        description: 'Created by Playwright API',
        body: 'This article was created for E2E automation testing.',
        tagList: ['playwright', 'e2e'],
      },
    },
  }
);

expect(articleResponse.status()).toBe(201);

const articleBody = await articleResponse.json();
console.log('게시글 생성 응답', articleBody);

const slug = articleBody.article.slug;
const title = articleBody.article.title;
const articleText = articleBody.article.body;

// API로 생성한 게시글을 보기 위해 로그인 
await page.goto('https://demo.realworld.show/login');

await page.getByPlaceholder('Email').fill(email);
await page.getByPlaceholder('Password').fill(password);
await page.getByRole('button', { name: 'Sign in' }).click();

await expect(page.getByText(username)).toBeVisible();

// API로 생성한 게시글이 UI에서 확인되는지 검증 
await page.goto(`https://demo.realworld.show/article/${slug}`);

await expect(page.getByRole('heading', { name: title })).toBeVisible();
await expect(page.getByText(articleText)).toBeVisible();

// UI에서 게시글 수정 테스트 
await page.getByRole('link', { name: 'Edit Article' }).first().click();

await expect(page.getByPlaceholder('Article Title')).toHaveValue(title);

const updatedBody = 'This article was updated through the UI.';

await page
  .getByPlaceholder('Write your article (in markdown)')
  .fill(updatedBody);

const updateResponsePromise = page.waitForResponse(
  response =>
    response.url().includes(`/api/articles/${slug}`) &&
    response.request().method() === 'PUT'
);

await page.getByRole('button', { name: 'Publish Article' }).click();

const updateResponse = await updateResponsePromise;

expect(updateResponse.status()).toBe(200);

//console.log('게시글 수정 status:', updateResponse.status());
// console.log('게시글 수정 응답:', await updateResponse.json());

// API로 게시글 수정이 정상적으로 되었는지 검증
const finalResponse = await request.get(
  `https://api.realworld.show/api/articles/${slug}`,
  {
    headers: {
      Authorization: `Token ${token}`,
    },
  }
);

expect(finalResponse.status()).toBe(200);

const finalBody = await finalResponse.json();

expect(finalBody.article.body).toBe(updatedBody);
}); 