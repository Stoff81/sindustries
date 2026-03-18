import { expect, test } from '@playwright/test';

const ASSIGNEE_OPTIONS = ['Quinn', 'Rowan', 'Lox', 'Tom'];

function mockTasks(tasks) {
  return async (route) => {
    const request = route.request();
    const method = request.method();
    const url = new URL(request.url());
    const isCollection = /\/tasks$/.test(url.pathname);
    const idMatch = url.pathname.match(/\/tasks\/([^/]+)$/);

    if (method === 'GET' && isCollection) {
      let filtered = tasks.filter((t) => !t.archivedAt);

      const assignee = url.searchParams.get('assignee');
      if (assignee === 'unassigned') {
        filtered = filtered.filter((t) => !t.assignee);
      } else if (assignee) {
        filtered = filtered.filter(
          (t) => t.assignee?.toLowerCase() === assignee.toLowerCase()
        );
      }

      const status = url.searchParams.get('status');
      if (status) {
        filtered = filtered.filter((t) => t.status === status);
      }

      const priority = url.searchParams.get('priority');
      if (priority) {
        filtered = filtered.filter((t) => t.priority === priority);
      }

      const q = url.searchParams.get('q');
      if (q) {
        const lower = q.toLowerCase();
        filtered = filtered.filter((t) => t.title.toLowerCase().includes(lower));
      }

      const includeArchived = url.searchParams.get('includeArchived') === 'true';
      if (includeArchived) {
        filtered = tasks.filter((t) => {
          let match = true;
          if (assignee === 'unassigned') match = match && !t.assignee;
          else if (assignee) match = match && t.assignee?.toLowerCase() === assignee.toLowerCase();
          if (status) match = match && t.status === status;
          return match;
        });
      }

      await route.fulfill({ json: { data: filtered } });
      return;
    }

    if (method === 'PATCH' && idMatch) {
      const id = idMatch[1];
      const body = request.postDataJSON();
      const task = tasks.find((t) => t.id === id);
      if (task) {
        Object.assign(task, body);
        if (body.status) task.statusChangedAt = new Date().toISOString();
      }
      await route.fulfill({ json: { data: task } });
      return;
    }

    await route.fulfill({ status: 404, json: { error: { message: 'Not found' } } });
  };
}

const baseTasks = [
  {
    id: 'task-quinn',
    title: 'Quinn task',
    status: 'open',
    statusChangedAt: new Date().toISOString(),
    priority: 'high',
    assignee: 'Quinn',
    archivedAt: null,
    blocked: false,
    ready: false,
    tags: []
  },
  {
    id: 'task-rowan',
    title: 'Rowan task',
    status: 'ready',
    statusChangedAt: new Date().toISOString(),
    priority: 'medium',
    assignee: 'Rowan',
    archivedAt: null,
    blocked: false,
    ready: false,
    tags: []
  },
  {
    id: 'task-lox',
    title: 'Lox task',
    status: 'doing',
    statusChangedAt: new Date().toISOString(),
    priority: 'low',
    assignee: 'Lox',
    archivedAt: null,
    blocked: false,
    ready: false,
    tags: []
  },
  {
    id: 'task-tom',
    title: 'Tom task',
    status: 'open',
    statusChangedAt: new Date().toISOString(),
    priority: 'urgent',
    assignee: 'Tom',
    archivedAt: null,
    blocked: false,
    ready: false,
    tags: []
  },
  {
    id: 'task-unassigned',
    title: 'Unassigned task',
    status: 'open',
    statusChangedAt: new Date().toISOString(),
    priority: 'medium',
    assignee: null,
    archivedAt: null,
    blocked: false,
    ready: false,
    tags: []
  }
];

// AC1: Filter dropdown is visible in the filter bar
test('AC1: assignee filter dropdown is visible', async ({ page }) => {
  await page.route('**/api/v1/tasks**', mockTasks(baseTasks));
  await page.goto('/');
  await page.getByRole('button', { name: 'Backlog' }).click();

  const filterRow = page.locator('.filter-row');
  await expect(filterRow).toBeVisible();

  const assigneeSelect = page.locator('select[aria-label="Assignee filter"]');
  await expect(assigneeSelect).toBeVisible();
});

// AC2: Options include all assignees plus "All" and "Unassigned"
test('AC2: dropdown options include all assignees', async ({ page }) => {
  await page.route('**/api/v1/tasks**', mockTasks(baseTasks));
  await page.goto('/');
  await page.getByRole('button', { name: 'Backlog' }).click();

  const assigneeSelect = page.locator('select[aria-label="Assignee filter"]');
  await expect(assigneeSelect).toBeVisible();

  // Check "All" option
  const allOption = assigneeSelect.locator('option[value=""]');
  await expect(allOption).toHaveText('Assignee: All');

  // Check "Unassigned" option
  const unassignedOption = assigneeSelect.locator('option[value="unassigned"]');
  await expect(unassignedOption).toHaveText('Assignee: Unassigned');

  // Check all assignee options
  for (const assignee of ASSIGNEE_OPTIONS) {
    const option = assigneeSelect.locator(`option[value="${assignee}"]`);
    await expect(option).toHaveText(`Assignee: ${assignee}`);
  }
});

// AC4: Real-time filtering when assignee is selected
test('AC4: filtering happens in real-time', async ({ page }) => {
  await page.route('**/api/v1/tasks**', mockTasks(baseTasks));
  await page.goto('/');
  // Board view shows all statuses by default, no auto-filter

  // All tasks are visible
  await expect(page.getByRole('button', { name: 'Quinn task' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Rowan task' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Lox task' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tom task' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Unassigned task' })).toBeVisible();

  // Select "Quinn" assignee
  const assigneeSelect = page.locator('select[aria-label="Assignee filter"]');
  await assigneeSelect.selectOption('Quinn');

  // Only Quinn's task visible
  await expect(page.getByRole('button', { name: 'Quinn task' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Rowan task' })).toBeHidden();
  await expect(page.getByRole('button', { name: 'Lox task' })).toBeHidden();
  await expect(page.getByRole('button', { name: 'Tom task' })).toBeHidden();
  await expect(page.getByRole('button', { name: 'Unassigned task' })).toBeHidden();

  // Switch to "Unassigned"
  await assigneeSelect.selectOption('unassigned');
  await expect(page.getByRole('button', { name: 'Quinn task' })).toBeHidden();
  await expect(page.getByRole('button', { name: 'Unassigned task' })).toBeVisible();
});

// AC3: Assignee filter combinable with other filters
test('AC3: combinable with other filters', async ({ page }) => {
  const mixedTasks = [
    {
      id: 'task-q-open',
      title: 'Quinn open task',
      status: 'open',
      statusChangedAt: new Date().toISOString(),
      priority: 'high',
      assignee: 'Quinn',
      archivedAt: null,
      blocked: false,
      ready: false,
      tags: []
    },
    {
      id: 'task-q-ready',
      title: 'Quinn ready task',
      status: 'ready',
      statusChangedAt: new Date().toISOString(),
      priority: 'high',
      assignee: 'Quinn',
      archivedAt: null,
      blocked: false,
      ready: false,
      tags: []
    },
    {
      id: 'task-r-open',
      title: 'Rowan open task',
      status: 'open',
      statusChangedAt: new Date().toISOString(),
      priority: 'medium',
      assignee: 'Rowan',
      archivedAt: null,
      blocked: false,
      ready: false,
      tags: []
    }
  ];

  await page.route('**/api/v1/tasks**', mockTasks(mixedTasks));
  await page.goto('/');
  // Use board view (all statuses visible by default)

  const assigneeSelect = page.locator('select[aria-label="Assignee filter"]');
  const statusSelect = page.locator('select[aria-label="Status filter"]');

  // Filter by assignee "Quinn" first
  await assigneeSelect.selectOption('Quinn');
  await expect(page.getByRole('button', { name: 'Quinn open task' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Quinn ready task' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Rowan open task' })).toBeHidden();

  // Then also filter by status "open" — should show only Quinn's open task
  await statusSelect.selectOption('open');
  await expect(page.getByRole('button', { name: 'Quinn open task' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Quinn ready task' })).toBeHidden();
  await expect(page.getByRole('button', { name: 'Rowan open task' })).toBeHidden();
});

// AC5: Selecting "All" resets the assignee filter
test('AC5: selecting "All" resets assignee filter', async ({ page }) => {
  await page.route('**/api/v1/tasks**', mockTasks(baseTasks));
  await page.goto('/');
  await page.getByRole('button', { name: 'Backlog' }).click();

  // Reset status filter so all tasks are visible
  const statusSelect = page.locator('select[aria-label="Status filter"]');
  await statusSelect.selectOption('');

  const assigneeSelect = page.locator('select[aria-label="Assignee filter"]');

  // Filter by "Rowan"
  await assigneeSelect.selectOption('Rowan');
  await expect(page.getByRole('button', { name: 'Rowan task' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Quinn task' })).toBeHidden();

  // Reset to "All"
  await assigneeSelect.selectOption('');
  await expect(page.getByRole('button', { name: 'Quinn task' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Rowan task' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Lox task' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tom task' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Unassigned task' })).toBeVisible();
});

// AC6: Filter state persists across view switches (board/backlog)
test('AC6: filter state persists across view switches', async ({ page }) => {
  await page.route('**/api/v1/tasks**', mockTasks(baseTasks));
  await page.goto('/');

  // Start in board view, set assignee filter
  const assigneeSelect = page.locator('select[aria-label="Assignee filter"]');
  await assigneeSelect.selectOption('Lox');
  await expect(page.getByRole('button', { name: 'Lox task' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Quinn task' })).toBeHidden();

  // Switch to backlog view
  await page.getByRole('button', { name: 'Backlog' }).click();

  // Reset status filter so all statuses show (backlog defaults to "open")
  const backlogStatusSelect = page.locator('select[aria-label="Status filter"]');
  await backlogStatusSelect.selectOption('');

  // Assignee filter should still be set to "Lox"
  const backlogAssigneeSelect = page.locator('select[aria-label="Assignee filter"]');
  await expect(backlogAssigneeSelect).toHaveValue('Lox');
  await expect(page.getByRole('button', { name: 'Lox task' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Quinn task' })).toBeHidden();

  // Switch back to board view
  await page.getByRole('button', { name: 'Kanban' }).click();

  // Filter should still be "Lox"
  const boardAssigneeSelect = page.locator('select[aria-label="Assignee filter"]');
  await expect(boardAssigneeSelect).toHaveValue('Lox');
});
