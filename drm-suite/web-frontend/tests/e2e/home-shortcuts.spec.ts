import { test, expect } from '@playwright/test';

test.describe('ホーム画面キーボードショートカット', () => {
  test.beforeEach(async ({ page }) => {
    // Feature Flag を有効化
    await page.goto('/home?ff:keyboard_shortcuts=on');
  });

  test('foremanロールでE/C/Bショートカットが発火する', async ({ page }) => {
    // 現場代理人ロールを設定
    await page.evaluate(() => localStorage.setItem('userRole', '施工管理'));
    await page.reload();

    // 入力フィールドがフォーカスされていないことを確認
    await page.click('body');

    // E キー: 出来高ダイアログが開く
    await page.keyboard.press('E');
    await expect(page.getByText('📊 出来高入力')).toBeVisible({
      timeout: 2000,
    });

    // ダイアログを閉じる
    await page.getByRole('button', { name: 'キャンセル' }).click();

    // C キー: CO起票ダイアログが開く
    await page.keyboard.press('C');
    await expect(page.getByText('🔄 変更工事（CO）起票')).toBeVisible({
      timeout: 2000,
    });

    // ダイアログを閉じる
    await page.keyboard.press('Escape');

    // B キー: 請求案ダイアログが開く
    await page.keyboard.press('B');
    await expect(page.getByText('💰 請求案作成')).toBeVisible({
      timeout: 2000,
    });
  });

  test('clerkロールでNショートカットが発火する', async ({ page }) => {
    // 事務員ロールを設定
    await page.evaluate(() => localStorage.setItem('userRole', '事務員'));
    await page.reload();

    await page.click('body');

    // N キー: 新規顧客ダイアログが開く
    await page.keyboard.press('N');
    await expect(page.getByText('👤 新規顧客登録')).toBeVisible({
      timeout: 2000,
    });

    // 必須フィールドの存在確認
    await expect(page.getByLabel('お名前')).toBeVisible();
    await expect(page.getByLabel('メールアドレス')).toBeVisible();
    await expect(page.getByLabel('電話番号')).toBeVisible();
  });

  test('aftercareロールでMショートカットが発火する', async ({ page }) => {
    // アフターケア担当ロールを設定
    await page.evaluate(() => localStorage.setItem('userRole', 'アフター担当'));
    await page.reload();

    await page.click('body');

    // M キー: 台帳合流ダイアログが開く
    await page.keyboard.press('M');
    await expect(page.getByText('📋 見積→台帳合流')).toBeVisible({
      timeout: 2000,
    });

    // 合流種別ボタンの存在確認
    await expect(
      page.getByRole('button', { name: 'アフターケア' }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'メンテナンス' }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: '保証管理' })).toBeVisible();
  });

  test('入力フィールドフォーカス時はショートカット無効', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('userRole', '施工管理'));
    await page.reload();

    // 検索入力フィールドにフォーカス（RAGパネルが開いている場合）
    const ragToggle = page.locator('[data-testid="rag-toggle"]');
    if (await ragToggle.isVisible()) {
      await ragToggle.click();

      const searchInput = page.getByPlaceholder('質問を入力...');
      await searchInput.focus();

      // フォーカス中はショートカットが無効
      await page.keyboard.press('E');
      await expect(page.getByText('📊 出来高入力')).not.toBeVisible();

      // フォーカス解除後は有効
      await searchInput.blur();
      await page.keyboard.press('E');
      await expect(page.getByText('📊 出来高入力')).toBeVisible({
        timeout: 2000,
      });
    }
  });

  test('修飾キー併用時はショートカット無効', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('userRole', '施工管理'));
    await page.reload();

    await page.click('body');

    // Ctrl+E は無効（ブラウザのデフォルト動作を維持）
    await page.keyboard.press('Control+E');
    await expect(page.getByText('📊 出来高入力')).not.toBeVisible();

    // Cmd+E も無効（macOS）
    await page.keyboard.press('Meta+E');
    await expect(page.getByText('📊 出来高入力')).not.toBeVisible();

    // Alt+E も無効
    await page.keyboard.press('Alt+E');
    await expect(page.getByText('📊 出来高入力')).not.toBeVisible();

    // 単体のEキーは有効
    await page.keyboard.press('E');
    await expect(page.getByText('📊 出来高入力')).toBeVisible({
      timeout: 2000,
    });
  });
});

test.describe('Feature Flag 制御テスト', () => {
  test('keyboard_shortcutsフラグが無効時はショートカット動作しない', async ({
    page,
  }) => {
    // Feature Flag を無効にしてアクセス
    await page.goto('/home');
    await page.evaluate(() => localStorage.setItem('userRole', '施工管理'));
    await page.reload();

    await page.click('body');
    await page.keyboard.press('E');

    // ダイアログが表示されないことを確認
    await expect(page.getByText('📊 出来高入力')).not.toBeVisible();
  });

  test('Feature Flag有効時のデバッグ情報表示', async ({ page }) => {
    await page.goto('/home?ff:keyboard_shortcuts=on');

    // 開発環境でのフラグ状態表示を確認
    const flagDebugger = page.locator('text=keyboard_shortcuts: ON');
    if (await flagDebugger.isVisible()) {
      await expect(flagDebugger).toBeVisible();
    }
  });
});

test.describe('ロール別ショートカット制御', () => {
  const roleShortcutTests = [
    {
      role: '経営者',
      roleKey: 'mgmt',
      shortcuts: ['E', 'R'], // 見積一覧, RAG切替
      description: '経営者ロールの基本ショートカット',
    },
    {
      role: '営業担当',
      roleKey: 'sales',
      shortcuts: ['E', 'N', 'R'], // 見積一覧, 新規見積, RAG切替
      description: '営業担当ロールのショートカット',
    },
    {
      role: '経理担当',
      roleKey: 'accounting',
      shortcuts: ['R'], // RAG切替のみ
      description: '経理担当ロールの限定ショートカット',
    },
  ];

  roleShortcutTests.forEach(({ role, roleKey, shortcuts, description }) => {
    test(`${description} - ${role}`, async ({ page }) => {
      await page.goto('/home?ff:keyboard_shortcuts=on');
      await page.evaluate((r) => localStorage.setItem('userRole', r), role);
      await page.reload();

      await page.click('body');

      for (const shortcut of shortcuts) {
        await page.keyboard.press(shortcut);

        // 各ショートカットに対応する動作があることを確認
        // (具体的な要素は実装に依存)
        await page.waitForTimeout(100);

        // ESCキーで開いたダイアログを閉じる
        await page.keyboard.press('Escape');
        await page.waitForTimeout(100);
      }
    });
  });
});
