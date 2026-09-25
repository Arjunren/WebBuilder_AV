import { test, expect } from '@playwright/test';

test('builds, edits, previews, saves, and exports a portfolio', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Blank canvas' }).click();
  await page.locator('[data-block-type="hero"]').dragTo(page.locator('#canvas'));
  await expect(page.locator('#canvas')).toContainText('I make digital ideas feel simple.');
  await page.locator('[data-node-type="heading"]').first().click();
  const headingText = page.locator('#properties-panel textarea').first();
  await headingText.fill('A portfolio heading edited visually');
  await headingText.press('Tab');
  await expect(page.locator('#canvas')).toContainText('A portfolio heading edited visually');
  await page.locator('[data-block-type="about"]').click();
  await page.locator('[data-block-type="projects"]').click();
  await page.getByRole('button', { name: 'Mobile', exact: true }).click();
  await expect(page.locator('#canvas-shell')).toHaveAttribute('data-viewport', 'mobile');
  const projectHeading = page.locator('[data-node-type="heading"]').last();
  await projectHeading.click();
  const responsiveSize = page
    .locator('#properties-panel .property-section')
    .filter({ hasText: 'Typography' })
    .locator('input[type="number"]')
    .first();
  await responsiveSize.fill('28');
  await responsiveSize.press('Tab');
  await expect(projectHeading).toHaveCSS('font-size', '28px');
  await page.locator('#undo-button').click();
  await expect(page.locator('[data-node-type="heading"]').last()).not.toHaveCSS(
    'font-size',
    '28px',
  );
  await page.locator('#redo-button').click();
  await expect(page.locator('[data-node-type="heading"]').last()).toHaveCSS('font-size', '28px');
  await page.locator('#save-button').click();
  await expect(page.locator('#save-label')).toContainText('Saved');
  await page.locator('#preview-button').click();
  await expect(page.locator('#preview-modal')).toBeVisible();
  await page.locator('#close-preview').click();
  await page.locator('#export-button').click();
  await expect(page.getByText('Your index.html is ready.')).toBeVisible();
  await expect(page.getByText('Saan mo gustong i-deploy ang website?')).toBeVisible();
});

test('supports keyboard duplicate and delete confirmation', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Blank canvas' }).click();
  await page.locator('[data-block-type="heading"]').click();
  await page.keyboard.press('Control+d');
  await expect(page.locator('[data-node-type="heading"]')).toHaveCount(2);
  await page.keyboard.press('Delete');
  await expect(page.locator('#confirm-modal')).toBeVisible();
  await page.locator('#confirm-delete').click();
  await expect(page.locator('[data-node-type="heading"]')).toHaveCount(1);
});
