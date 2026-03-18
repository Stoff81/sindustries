import { expect, test } from '@playwright/test';

const RESERVED_ASSIGNEES = ['Tom', 'Quinn', 'Rowan', 'Lox'];

test('AC2: assignee dropdown shows reserved options', async ({ page }) => {
  await page.goto('/');
  
  // Click on a task to open the editor
  await page.locator('.task-card').first().click();
  
  // Find the assignee dropdown (it's a select with aria-label "Detail assignee")
  const assigneeSelect = page.locator('select[aria-label="Detail assignee"]');
  await expect(assigneeSelect).toBeVisible();
  
  // Check that it's a select element
  await expect(assigneeSelect).toHaveTag('select');
  
  // Check all options are present including "Unassigned"
  await expect(assigneeSelect.locator('option')).toHaveCount(RESERVED_ASSIGNEES.length + 1);
  
  // Verify each reserved option exists
  for (const assignee of RESERVED_ASSIGNEES) {
    await expect(assigneeSelect.locator(`option[value="${assignee}"]`)).toBeVisible();
  }
  
  // Verify "Unassigned" option exists
  await expect(assigneeSelect.locator('option[value=""]')).toBeVisible();
});

test('AC3: can select assignee from dropdown', async ({ page }) => {
  await page.goto('/');
  
  // Click on a task to open the editor
  await page.locator('.task-card').first().click();
  
  // Find the assignee dropdown
  const assigneeSelect = page.locator('select[aria-label="Detail assignee"]');
  
  // Select "Quinn"
  await assigneeSelect.selectOption('Quinn');
  
  // Verify selection
  await expect(assigneeSelect).toHaveValue('Quinn');
});
