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

test('adds pages, opens guidance, audits content, and works from the mobile dock', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Blank canvas' }).click();

  await page.getByRole('button', { name: 'How to use', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'How to use the builder' })).toBeVisible();
  await page.locator('[data-close="help-modal"]').click();

  await page.getByRole('button', { name: 'Pages', exact: true }).last().click();
  await expect(page.locator('#left-sidebar')).toHaveClass(/mobile-open/);
  page.once('dialog', (dialog) => dialog.accept('Case Studies'));
  await page.getByRole('button', { name: '+ Add' }).click();
  await expect(page.locator('#pages-panel')).toContainText('Case Studies');
  await page.locator('#mobile-panel-backdrop').click({ position: { x: 2, y: 2 } });

  await page.getByRole('button', { name: 'Blocks', exact: true }).last().click();
  await page.locator('[data-block-type="heading"]').click();
  await expect(page.locator('#canvas')).toContainText('A clear, memorable heading');

  await page.getByRole('button', { name: 'Check' }).click();
  await expect(page.getByRole('heading', { name: 'Accessibility report' })).toBeVisible();
  await expect(page.locator('#audit-results')).toContainText('Add one H1 heading');
  await page.locator('[data-close="audit-modal"]').click();

  await page.locator('#zoom-out').click();
  await expect(page.locator('#zoom-label')).toHaveText('90%');
  await expect(page.locator('.creator-credit')).toHaveAttribute(
    'href',
    'https://github.com/ArjunrenVon',
  );
});

test('persists and exports projects without the server in device-local mode', async ({ page }) => {
  await page.goto('/?local=1');
  await page.getByRole('button', { name: 'Blank canvas' }).click();
  await page.locator('[data-block-type="heading"]').click();
  await page.locator('#save-button').click();
  await expect(page.locator('#save-label')).toContainText('Saved');

  await page.reload();
  await page.getByRole('button', { name: 'Open saved project' }).click();
  await page.locator('#project-list .project-card').first().click();
  await expect(page.locator('#canvas')).toContainText('A clear, memorable heading');

  await page.locator('#export-button').click();
  await expect(
    page.getByRole('button', { name: 'Save index.html', exact: true }).first(),
  ).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save index.html', exact: true }).first().click();
  expect((await download).suggestedFilename()).toBe('index.html');
});
