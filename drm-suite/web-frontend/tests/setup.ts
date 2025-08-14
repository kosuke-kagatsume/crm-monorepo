import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // Basic setup - ensure the app is running
  await page.goto('/');

  // Set default user role for testing
  await page.evaluate(() => {
    localStorage.setItem('userRole', '経営者');
  });

  // Wait for the app to initialize
  await page.waitForLoadState('networkidle');

  // Save authentication state
  await page.context().storageState({ path: authFile });
});

setup('verify app health', async ({ page }) => {
  // Basic health check
  await page.goto('/');
  await expect(page).toHaveTitle(/DRM Suite|Home/);

  // Verify critical paths are accessible
  const criticalPaths = ['/home', '/estimate', '/projects'];

  for (const path of criticalPaths) {
    await page.goto(path);
    await page.waitForLoadState('networkidle');

    // Should not show error pages
    const errorElement = page
      .locator('text=Error', 'text=404', 'text=500')
      .first();
    await expect(errorElement).not.toBeVisible();
  }
});
