import { Page } from '@playwright/test';

export class ArticleEditorPage {
    constructor(private readonly page: Page) { }

    async open() {
        await this.page.goto('/editor');
    }

    async fillTitle(title: string) {
        await this.page
            .getByPlaceholder('Article Title')
            .fill(title);
    }

    async fillDescription(description: string) {
        await this.page
            .getByPlaceholder("What's this article about?")
            .fill(description);
    }

    async fillBody(body: string) {
        await this.page
            .getByPlaceholder('Write your article (in markdown)')
            .fill(body);
    }

    async publish() {
        await this.page
            .getByRole('button', { name: 'Publish Article' })
            .click();
    }
}