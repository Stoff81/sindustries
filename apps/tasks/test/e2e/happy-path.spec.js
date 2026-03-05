import { expect, test } from '@playwright/test';

test('happy path: create task, move to doing, archive', async ({ page }) => {
  const title = `Created in e2e ${Date.now()}`;

  await page.goto('/');
  await page.getByLabel('New task title').fill(title);
  await page.getByRole('button', { name: 'New Task' }).click();
  await expect(page.getByRole('button', { name: title })).toBeVisible();

  await page.getByRole('button', { name: 'Kanban' }).click();

  const card = page.locator('[data-testid^="card-"]', { hasText: title });
  await expect(card).toBeVisible();

  const cardId = await card.getAttribute('data-testid');
  const doing = page.getByTestId('column-doing');
  await card.dragTo(doing);

  await expect(page.getByTestId(cardId)).toBeVisible();

  await page.getByRole('button', { name: title }).first().click();
  await page.getByRole('button', { name: 'Archive task' }).click();

  await expect(page.getByRole('button', { name: title })).toHaveCount(0);
});
