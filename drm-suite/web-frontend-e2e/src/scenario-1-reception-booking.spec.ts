import { test, expect } from '@playwright/test';

test.describe('シナリオ1: 事務→来店受付→商談室/車両同時確保', () => {
  test.beforeEach(async ({ page }) => {
    // 事務スタッフとしてログイン
    await page.goto('/login');
    await page.fill('[name="email"]', 'admin@drm-suite.com');
    await page.fill('[name="password"]', 'admin123');
    await page.click('[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('来店受付から商談室と車両の同時予約（先勝ち衝突解決）', async ({ page, context }) => {
    // Step 1: 来店受付画面へ遷移
    await page.goto('/reception');
    await expect(page.locator('h1')).toContainText('来店受付');

    // Step 2: 新規顧客情報入力
    await page.click('[data-testid="new-customer-btn"]');
    await page.fill('[name="customerName"]', '田中太郎');
    await page.fill('[name="phone"]', '090-1234-5678');
    await page.fill('[name="purpose"]', '新築相談');
    
    // Step 3: 商談室予約
    await page.click('[data-testid="book-meeting-room"]');
    await page.selectOption('[name="roomId"]', 'room-1');
    await page.fill('[name="startTime"]', '14:00');
    await page.fill('[name="duration"]', '60');
    
    // Step 4: 車両予約（並行して）
    const page2 = await context.newPage();
    await page2.goto('/booking/vehicles');
    await page2.selectOption('[name="vehicleId"]', 'vehicle-1');
    await page2.fill('[name="startTime"]', '14:00');
    
    // Step 5: 同時確保を試みる（先勝ち処理）
    const [response1, response2] = await Promise.allSettled([
      page.click('[data-testid="confirm-booking"]'),
      page2.click('[data-testid="confirm-vehicle-booking"]')
    ]);
    
    // Step 6: 衝突解決の確認
    if (response1.status === 'fulfilled') {
      // 商談室が確保された場合
      await expect(page.locator('[data-testid="booking-success"]')).toBeVisible();
      await expect(page.locator('[data-testid="booking-id"]')).toContainText(/BOOK-\d+/);
      
      // 車両予約側で衝突エラーを確認
      await expect(page2.locator('[data-testid="booking-conflict"]')).toBeVisible();
      await expect(page2.locator('[data-testid="conflict-message"]')).toContainText('既に予約が入っています');
      
      // 代替時間の提案を確認
      await expect(page2.locator('[data-testid="alternative-slots"]')).toBeVisible();
      const alternatives = await page2.locator('[data-testid="alternative-slot"]').count();
      expect(alternatives).toBeGreaterThan(0);
    }
    
    // Step 7: 予約確認画面での表示
    await page.goto('/bookings/today');
    await expect(page.locator('[data-testid="booking-list"]')).toContainText('田中太郎');
    await expect(page.locator('[data-testid="room-status-room-1"]')).toHaveClass(/occupied/);
  });

  test('ダブルブッキング防止メカニズムの確認', async ({ page, browser }) => {
    // 2つのブラウザセッションで同時予約を試みる
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    
    // 両方のセッションでログイン
    for (const p of [page1, page2]) {
      await p.goto('/login');
      await p.fill('[name="email"]', 'admin@drm-suite.com');
      await p.fill('[name="password"]', 'admin123');
      await p.click('[type="submit"]');
    }
    
    // 同じリソースを同時に予約
    await page1.goto('/booking/rooms');
    await page2.goto('/booking/rooms');
    
    await page1.selectOption('[name="roomId"]', 'room-2');
    await page2.selectOption('[name="roomId"]', 'room-2');
    
    await page1.fill('[name="date"]', '2025-01-15');
    await page2.fill('[name="date"]', '2025-01-15');
    
    await page1.fill('[name="startTime"]', '10:00');
    await page2.fill('[name="startTime"]', '10:00');
    
    // 同時送信
    const [result1, result2] = await Promise.allSettled([
      page1.click('[data-testid="submit-booking"]'),
      page2.click('[data-testid="submit-booking"]')
    ]);
    
    // 片方は成功、もう片方は失敗することを確認
    const successCount = [page1, page2].filter(async (p) => 
      await p.locator('[data-testid="booking-success"]').isVisible()
    ).length;
    
    expect(successCount).toBe(1);
    
    await context1.close();
    await context2.close();
  });

  test('予約変更時の通知とUI更新', async ({ page }) => {
    // 既存予約の変更
    await page.goto('/bookings');
    await page.click('[data-testid="booking-row-1"]');
    await page.click('[data-testid="edit-booking"]');
    
    // 時間変更
    await page.fill('[name="startTime"]', '15:00');
    await page.click('[data-testid="save-changes"]');
    
    // リアルタイム通知の確認
    await expect(page.locator('[data-testid="notification"]')).toContainText('予約が更新されました');
    
    // カレンダービューの自動更新確認
    await page.goto('/calendar');
    await expect(page.locator('[data-testid="calendar-slot-15-00"]')).toHaveClass(/booked/);
    await expect(page.locator('[data-testid="calendar-slot-14-00"]')).not.toHaveClass(/booked/);
  });
});