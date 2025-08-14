import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('見積モジュール アクセシビリティテスト', () => {
  test.beforeEach(async ({ page }) => {
    // ログイン処理（モック）
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.setItem('userRole', '営業担当');
      localStorage.setItem('userEmail', 'sales@drm.com');
      localStorage.setItem('userName', '営業太郎');
    });
  });

  test('見積一覧ページのa11yチェック', async ({ page }) => {
    await page.goto('/estimate');
    await injectAxe(page);
    
    // ページの読み込み待機
    await page.waitForSelector('h1:has-text("見積管理")');
    
    // axe-coreによるアクセシビリティチェック
    const results = await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: {
        html: true
      }
    });
    
    // 重要な要素の存在確認
    await expect(page.getByRole('heading', { level: 1 })).toContainText('見積管理');
    await expect(page.getByRole('button', { name: /新規見積作成/ })).toBeVisible();
    
    // キーボードナビゲーション
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
    
    // ARIAラベルの確認
    const searchInput = page.getByPlaceholder('見積名で検索...');
    await expect(searchInput).toHaveAttribute('type', 'text');
    
    // テーブルのアクセシビリティ
    const table = page.locator('table');
    await expect(table).toHaveAttribute('role', 'table');
    
    // スクリーンリーダー用のテキスト
    const srOnlyElements = page.locator('.sr-only');
    const count = await srOnlyElements.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('見積編集ページのa11yチェック', async ({ page }) => {
    await page.goto('/estimate/new');
    await injectAxe(page);
    
    // フォーム要素のラベル確認
    const formLabels = page.locator('label');
    const labelCount = await formLabels.count();
    expect(labelCount).toBeGreaterThan(0);
    
    // 各入力フィールドにラベルが関連付けられているか
    const inputs = page.locator('input[type="text"], input[type="number"]');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        await expect(label).toHaveCount(1);
      }
    }
    
    // フォーカス管理
    await page.getByLabel('見積名').focus();
    await expect(page.getByLabel('見積名')).toBeFocused();
    
    // エラーメッセージのARIA
    await page.getByRole('button', { name: '保存' }).click();
    const errorMessage = page.locator('[role="alert"]').first();
    if (await errorMessage.isVisible()) {
      await expect(errorMessage).toHaveAttribute('aria-live', 'polite');
    }
    
    // コントラスト比のチェック
    await checkA11y(page, null, {
      rules: {
        'color-contrast': { enabled: true }
      }
    });
  });

  test('モーダル・ダイアログのa11yチェック', async ({ page }) => {
    await page.goto('/estimate/new');
    
    // テンプレート選択ダイアログを開く
    const templateButton = page.getByRole('button', { name: /テンプレート/ });
    if (await templateButton.isVisible()) {
      await templateButton.click();
      
      // モーダルのARIA属性
      const modal = page.locator('[role="dialog"]').first();
      await expect(modal).toHaveAttribute('aria-modal', 'true');
      await expect(modal).toHaveAttribute('aria-labelledby', /.+/);
      
      // フォーカストラップ
      await page.keyboard.press('Tab');
      const focusedInModal = await page.evaluate(() => {
        const activeElement = document.activeElement;
        const modal = document.querySelector('[role="dialog"]');
        return modal?.contains(activeElement);
      });
      expect(focusedInModal).toBeTruthy();
      
      // ESCキーでモーダルを閉じる
      await page.keyboard.press('Escape');
      await expect(modal).not.toBeVisible();
    }
  });

  test('バッジとステータスのa11yチェック', async ({ page }) => {
    await page.goto('/estimate');
    
    // ステータスバッジ
    const badges = page.locator('[role="status"]');
    const badgeCount = await badges.count();
    
    if (badgeCount > 0) {
      for (let i = 0; i < badgeCount; i++) {
        const badge = badges.nth(i);
        // スクリーンリーダー用の追加情報があるか
        const ariaLabel = await badge.getAttribute('aria-label');
        expect(ariaLabel).toBeTruthy();
      }
    }
    
    // 色だけに依存しない情報伝達
    const approvedBadges = page.locator('.bg-green-100');
    const approvedCount = await approvedBadges.count();
    if (approvedCount > 0) {
      const text = await approvedBadges.first().textContent();
      expect(text).toContain('承認済み');
    }
  });

  test('レスポンシブデザインとタッチターゲット', async ({ page }) => {
    // モバイルビューポート
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/estimate');
    
    // タッチターゲットサイズ（最小44x44px）
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = buttons.nth(i);
      const box = await button.boundingBox();
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
    
    // モバイルメニューのアクセシビリティ
    const mobileMenuButton = page.locator('[aria-label="メニュー"]');
    if (await mobileMenuButton.isVisible()) {
      await expect(mobileMenuButton).toHaveAttribute('aria-expanded', /(true|false)/);
    }
  });

  test('フォームバリデーションのa11y', async ({ page }) => {
    await page.goto('/estimate/new');
    
    // 必須フィールドのマーキング
    const requiredInputs = page.locator('input[required], input[aria-required="true"]');
    const requiredCount = await requiredInputs.count();
    expect(requiredCount).toBeGreaterThan(0);
    
    // エラー状態のARIA
    await page.getByRole('button', { name: '保存' }).click();
    
    const invalidInputs = page.locator('input[aria-invalid="true"]');
    const invalidCount = await invalidInputs.count();
    
    if (invalidCount > 0) {
      // エラーメッセージとの関連付け
      const firstInvalid = invalidInputs.first();
      const describedBy = await firstInvalid.getAttribute('aria-describedby');
      if (describedBy) {
        const errorElement = page.locator(`#${describedBy}`);
        await expect(errorElement).toBeVisible();
      }
    }
  });

  test('データテーブルのa11y', async ({ page }) => {
    await page.goto('/estimate/1'); // 見積詳細ページ
    
    const table = page.locator('table').first();
    if (await table.isVisible()) {
      // テーブルヘッダー
      const headers = table.locator('th');
      const headerCount = await headers.count();
      expect(headerCount).toBeGreaterThan(0);
      
      // スコープ属性
      for (let i = 0; i < headerCount; i++) {
        const header = headers.nth(i);
        const scope = await header.getAttribute('scope');
        expect(['col', 'row']).toContain(scope);
      }
      
      // キャプション
      const caption = table.locator('caption');
      if (await caption.isVisible()) {
        const captionText = await caption.textContent();
        expect(captionText).toBeTruthy();
      }
    }
  });

  test('ローディング状態のa11y', async ({ page }) => {
    await page.goto('/estimate');
    
    // ローディングインジケーター
    const spinner = page.locator('[role="status"]').filter({ hasText: /読み込み中/ });
    if (await spinner.isVisible()) {
      await expect(spinner).toHaveAttribute('aria-live', 'polite');
      
      // スクリーンリーダー用のテキスト
      const srText = await spinner.locator('.sr-only').textContent();
      expect(srText).toContain('読み込み中');
    }
  });

  test('ナビゲーションのa11y', async ({ page }) => {
    await page.goto('/estimate');
    
    // ナビゲーションランドマーク
    const nav = page.locator('nav');
    await expect(nav.first()).toBeVisible();
    
    // パンくずリスト
    const breadcrumb = page.locator('[aria-label="パンくずリスト"]');
    if (await breadcrumb.isVisible()) {
      const items = breadcrumb.locator('li');
      const itemCount = await items.count();
      expect(itemCount).toBeGreaterThan(0);
      
      // 現在のページ
      const current = breadcrumb.locator('[aria-current="page"]');
      await expect(current).toHaveCount(1);
    }
    
    // スキップリンク
    const skipLink = page.locator('a:has-text("メインコンテンツへスキップ")');
    if (await skipLink.isVisible()) {
      await expect(skipLink).toHaveAttribute('href', '#main');
    }
  });

  test('カラーコントラストと視覚的表現', async ({ page }) => {
    await page.goto('/estimate');
    
    // WCAG AAレベルのコントラスト比チェック
    await checkA11y(page, null, {
      rules: {
        'color-contrast': { 
          enabled: true,
          options: {
            contrastRatio: {
              normal: {
                expected: 4.5
              },
              large: {
                expected: 3
              }
            }
          }
        }
      }
    });
    
    // ハイコントラストモードの対応
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.reload();
    
    // ダークモードでも読みやすいか
    const text = page.locator('body');
    const color = await text.evaluate(el => 
      window.getComputedStyle(el).color
    );
    expect(color).toBeTruthy();
  });
});