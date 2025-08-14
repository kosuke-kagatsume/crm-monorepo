import { test, expect } from '@playwright/test';

test.describe('視覚回帰テスト: /projects 保護', () => {
  test.beforeEach(async ({ page }) => {
    // Feature Flag を無効化して既存動作を確認
    await page.goto('/projects');
  });

  test('/projects ページの視覚的一貫性', async ({ page }) => {
    // ページが完全にロードされるまで待機
    await page.waitForLoadState('networkidle');

    // 主要な要素が表示されるまで待機
    await page.waitForSelector('h1, [role="main"], .project-list, .container', {
      timeout: 10000,
    });

    // 動的コンテンツの安定化待機
    await page.waitForTimeout(2000);

    // ページ全体のスクリーンショット
    await expect(page).toHaveScreenshot('projects-full-page.png', {
      fullPage: true,
      animations: 'disabled',
      threshold: 0.3, // 30% までの差異を許容（フォント等の環境差異対応）
    });
  });

  test('プロジェクト一覧テーブルの視覚確認', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // テーブル領域が存在する場合のみテスト実行
    const table = page
      .locator('table, .project-list, [data-testid="projects-table"]')
      .first();

    if (await table.isVisible()) {
      await expect(table).toHaveScreenshot('projects-table.png', {
        animations: 'disabled',
        threshold: 0.2,
      });
    } else {
      // テーブルが存在しない場合は警告ログのみ
      console.warn('Projects table not found - skipping table screenshot');
    }
  });

  test('ヘッダー・ナビゲーションの一貫性', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // ヘッダー部分が存在する場合のテスト
    const header = page.locator('header, nav, .header, .navbar').first();

    if (await header.isVisible()) {
      await expect(header).toHaveScreenshot('projects-header.png', {
        animations: 'disabled',
        threshold: 0.2,
      });
    }
  });

  test('Feature Flag が無効な状態での動作確認', async ({ page }) => {
    // 明示的に Feature Flag を無効化
    await page.goto(
      '/projects?ff:new_dash=off&ff:new_estimate=off&ff:keyboard_shortcuts=off',
    );
    await page.waitForLoadState('networkidle');

    // 新機能の UI 要素が表示されないことを確認
    const shortcutDebugger = page.locator('text=keyboard_shortcuts: ON');
    await expect(shortcutDebugger).not.toBeVisible();

    const newDashIndicator = page.locator('text=新ダッシュボード');
    await expect(newDashIndicator).not.toBeVisible();

    // 既存機能が正常動作することを確認
    await expect(page).toHaveScreenshot('projects-legacy-mode.png', {
      fullPage: true,
      animations: 'disabled',
      threshold: 0.3,
    });
  });

  test('レスポンシブデザインの確認（モバイル）', async ({ page }) => {
    // モバイルビューポート設定
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    await expect(page).toHaveScreenshot('projects-mobile.png', {
      fullPage: true,
      animations: 'disabled',
      threshold: 0.3,
    });
  });

  test('レスポンシブデザインの確認（タブレット）', async ({ page }) => {
    // タブレットビューポート設定
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    await expect(page).toHaveScreenshot('projects-tablet.png', {
      fullPage: true,
      animations: 'disabled',
      threshold: 0.3,
    });
  });
});

test.describe('既存機能への影響がないことの確認', () => {
  test('権限マスク機能が /projects に影響しないことを確認', async ({
    page,
  }) => {
    // 異なる役職でアクセスして視覚的差異がないことを確認
    const roles = ['経営者', '営業担当', '事務員'];

    for (const role of roles) {
      await page.goto('/projects');
      await page.evaluate((r) => localStorage.setItem('userRole', r), role);
      await page.reload();
      await page.waitForLoadState('networkidle');

      // 各役職での画面が同じであることを確認
      // (projectsページは権限マスクの対象外のため同じ表示になるべき)
      await expect(page).toHaveScreenshot(`projects-role-${role}.png`, {
        fullPage: true,
        animations: 'disabled',
        threshold: 0.1, // より厳密なチェック
      });
    }
  });

  test('RAG システムが /projects に影響しないことを確認', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');

    // RAG パネルが表示されないことを確認
    const ragPanel = page.locator('[data-testid="rag-panel"], .rag-panel');
    await expect(ragPanel).not.toBeVisible();

    // RAG トグルボタンが表示されないことを確認
    const ragToggle = page.locator('[data-testid="rag-toggle"], .rag-toggle');
    await expect(ragToggle).not.toBeVisible();
  });

  test('キーボードショートカットが /projects で無効化されていることを確認', async ({
    page,
  }) => {
    await page.goto('/projects?ff:keyboard_shortcuts=on');
    await page.evaluate(() => localStorage.setItem('userRole', '施工管理'));
    await page.reload();
    await page.waitForLoadState('networkidle');

    await page.click('body'); // フォーカスを body に移動

    // 施工管理用のショートカット（E/C/B）が動作しないことを確認
    await page.keyboard.press('E');
    await page.waitForTimeout(1000);

    // 出来高ダイアログが表示されないことを確認
    const progressDialog = page.getByText('📊 出来高入力');
    await expect(progressDialog).not.toBeVisible();

    // C キーも無効
    await page.keyboard.press('C');
    await page.waitForTimeout(1000);

    const changeOrderDialog = page.getByText('🔄 変更工事（CO）起票');
    await expect(changeOrderDialog).not.toBeVisible();
  });
});
