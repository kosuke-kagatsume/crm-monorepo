import { test, expect } from '@playwright/test';

test('projects 画面は基準から差分ゼロ', async ({ page }) => {
  await page.goto('/projects');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000); // 安定化待機

  await expect(page).toHaveScreenshot('projects-baseline.png', {
    fullPage: true,
    animations: 'disabled',
    threshold: 0.01, // 1%未満の差異のみ許容
  });
});
