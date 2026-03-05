import { expect, test } from '@playwright/test';

test('happy path: create task, move to doing, archive', async ({ page }) => {
  const tasks = [
    {
      id: 't1',
      title: 'Existing',
      status: 'todo',
      statusChangedAt: '2026-03-01T00:00:00.000Z',
      priority: 'medium'
    }
  ];

  await page.route('**/api/v1/tasks**', async (route) => {
    const req = route.request();
    if (req.method() === 'GET') {
      await route.fulfill({ json: { data: tasks } });
      return;
    }
    if (req.method() === 'POST') {
      const body = JSON.parse(req.postData() ?? '{}');
      tasks.push({
        id: 't2',
        title: body.title,
        status: 'todo',
        statusChangedAt: new Date().toISOString(),
        priority: 'medium'
      });
      await route.fulfill({ status: 201, json: { data: tasks.at(-1) } });
      return;
    }
    await route.continue();
  });

  await page.route('**/api/v1/tasks/t2', async (route) => {
    const req = route.request();
    if (req.method() === 'PATCH') {
      const body = JSON.parse(req.postData() ?? '{}');
      tasks[1] = { ...tasks[1], ...body, statusChangedAt: new Date().toISOString() };
      await route.fulfill({ json: { data: tasks[1] } });
      return;
    }

    if (req.method() === 'DELETE') {
      tasks.splice(1, 1);
      await route.fulfill({ json: { data: { id: 't2', archivedAt: new Date().toISOString() } } });
      return;
    }

    await route.continue();
  });

  await page.goto('/');
  await page.getByLabel('New task title').fill('Created in e2e');
  await page.getByRole('button', { name: 'New Task' }).click();
  await expect(page.getByRole('button', { name: 'Created in e2e' })).toBeVisible();

  await page.getByRole('button', { name: 'Kanban' }).click();
  const card = page.getByTestId('card-t2');
  const doing = page.getByTestId('column-doing');
  await card.dragTo(doing);

  await page.getByRole('button', { name: 'Created in e2e' }).click();
  await page.getByRole('button', { name: 'Archive task' }).click();

  await expect(page.getByRole('button', { name: 'Created in e2e' })).toHaveCount(0);
});
