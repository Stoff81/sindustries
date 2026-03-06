import { expect, test } from '@playwright/test';

test('happy path: create task, move to doing, archive', async ({ page }) => {
  const title = `Created in e2e ${Date.now()}`;
  const now = new Date().toISOString();
  const tasks = [
    {
      id: 'task-1',
      title: 'Task 1',
      status: 'todo',
      statusChangedAt: now,
      priority: 'medium',
      archivedAt: null,
      tags: []
    }
  ];

  await page.route('**/api/v1/tasks**', async (route) => {
    const request = route.request();
    const method = request.method();
    const url = new URL(request.url());
    const isCollection = /\/tasks$/.test(url.pathname);
    const idMatch = url.pathname.match(/\/tasks\/([^/]+)$/);

    if (method === 'GET' && isCollection) {
      const includeArchived = url.searchParams.get('includeArchived') === 'true';
      const visible = includeArchived ? tasks : tasks.filter((task) => !task.archivedAt);
      await route.fulfill({ json: { data: visible } });
      return;
    }

    if (method === 'POST' && isCollection) {
      const body = request.postDataJSON();
      const created = {
        id: `task-${Date.now()}`,
        title: body.title,
        description: body.description ?? null,
        status: 'todo',
        statusChangedAt: new Date().toISOString(),
        priority: body.priority ?? 'medium',
        assignee: body.assignee ?? null,
        dueAt: body.dueAt ?? null,
        tags: (body.tags ?? []).map((tag) => ({ name: tag })),
        archivedAt: null
      };
      tasks.push(created);
      await route.fulfill({ json: { data: created } });
      return;
    }

    if (method === 'PATCH' && idMatch) {
      const id = idMatch[1];
      const body = request.postDataJSON();
      const task = tasks.find((entry) => entry.id === id);
      if (task) {
        Object.assign(task, body);
        if (body.status) task.statusChangedAt = new Date().toISOString();
      }
      await route.fulfill({ json: { data: task } });
      return;
    }

    if (method === 'DELETE' && idMatch) {
      const id = idMatch[1];
      const task = tasks.find((entry) => entry.id === id);
      if (task) task.archivedAt = new Date().toISOString();
      await route.fulfill({ json: { data: task } });
      return;
    }

    await route.fulfill({ status: 404, json: { error: { message: 'Not found' } } });
  });

  await page.goto('/');
  await page.getByRole('button', { name: '+ New Task' }).click();
  await page.getByLabel('New task title').fill(title);
  await page.getByRole('button', { name: 'Create task' }).click();
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
