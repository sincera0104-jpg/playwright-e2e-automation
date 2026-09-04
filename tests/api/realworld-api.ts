import { APIRequestContext, expect } from '@playwright/test';

const API_BASE_URL = 'https://api.realworld.show/api';

export async function createUser(
  request: APIRequestContext,
  username: string,
  email: string,
  password: string
) {
  const response = await request.post(
    `${API_BASE_URL}/users`,
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

  return await response.json();
}

export async function createArticle(
  request: APIRequestContext,
  token: string,
  title: string,
  description: string,
  body: string,
  tagList: string[]
) {
  const response = await request.post(
    `${API_BASE_URL}/articles`,
    {
      headers: {
        Authorization: `Token ${token}`,
      },
      data: {
        article: {
          title,
          description,
          body,
          tagList,
        },
      },
    }
  );

  expect(response.status()).toBe(201);

  return await response.json();
}

export async function getArticle(
  request: APIRequestContext,
  token: string,
  slug: string
) {
  const response = await request.get(
    `${API_BASE_URL}/articles/${slug}`,
    {
      headers: {
        Authorization: `Token ${token}`,
      },
    }
  );

  expect(response.status()).toBe(200);

  return await response.json();
}

export async function expectArticleNotFound(
  request: APIRequestContext,
  token: string,
  slug: string
) {
  const response = await request.get(
    `${API_BASE_URL}/articles/${slug}`,
    {
      headers: {
        Authorization: `Token ${token}`,
      },
    }
  );

  expect(response.status()).toBe(404);
}

export async function deleteArticle(
  request: APIRequestContext,
  token: string,
  slug: string
) {
  const response = await request.delete(
    `${API_BASE_URL}/articles/${slug}`,
    {
      headers: {
        Authorization: `Token ${token}`,
      },
    }
  );

  expect(response.status()).toBe(204);
}

