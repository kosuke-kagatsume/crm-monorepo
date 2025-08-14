import { test, expect } from '@playwright/test';

test.describe('シナリオ2: アフター→点検予定→即時見積→通常台帳合流', () => {
  test.beforeEach(async ({ page }) => {
    // アフターケアスタッフとしてログイン
    await page.goto('/login');
    await page.fill('[name="email"]', 'aftercare@drm-suite.com');
    await page.fill('[name="password"]', 'aftercare123');
    await page.click('[type="submit"]');
    await expect(page).toHaveURL('/aftercare/dashboard');
  });

  test('点検予定から即時見積作成と台帳への合流', async ({ page }) => {
    // Step 1: 点検予定一覧を表示
    await page.goto('/aftercare/inspections');
    await expect(page.locator('h1')).toContainText('定期点検予定');
    
    // Step 2: 本日の点検を選択
    await page.click('[data-testid="inspection-today-1"]');
    await expect(page.locator('[data-testid="customer-name"]')).toContainText('山田花子');
    await expect(page.locator('[data-testid="inspection-type"]')).toContainText('1年点検');
    
    // Step 3: 点検チェックリストを実施
    await page.click('[data-testid="start-inspection"]');
    
    // チェック項目を入力
    await page.check('[data-testid="check-exterior-wall"]');
    await page.check('[data-testid="check-roof"]');
    await page.uncheck('[data-testid="check-waterproof"]'); // 不具合発見
    
    // 不具合詳細を記入
    await page.fill('[data-testid="defect-description"]', '防水層に軽微な劣化を確認');
    await page.selectOption('[data-testid="defect-severity"]', 'medium');
    
    // 写真アップロード
    const fileInput = await page.locator('[data-testid="defect-photo"]');
    await fileInput.setInputFiles('./test-fixtures/defect-photo.jpg');
    
    // Step 4: 即時見積の作成
    await page.click('[data-testid="create-quick-estimate"]');
    
    // 見積項目を追加
    await page.click('[data-testid="add-estimate-item"]');
    await page.fill('[data-testid="item-name-1"]', '防水層補修工事');
    await page.fill('[data-testid="item-quantity-1"]', '10');
    await page.fill('[data-testid="item-unit-1"]', '㎡');
    await page.fill('[data-testid="item-price-1"]', '5000');
    
    await page.click('[data-testid="add-estimate-item"]');
    await page.fill('[data-testid="item-name-2"]', '諸経費');
    await page.fill('[data-testid="item-quantity-2"]', '1');
    await page.fill('[data-testid="item-unit-2"]', '式');
    await page.fill('[data-testid="item-price-2"]', '10000');
    
    // 見積合計の自動計算確認
    await expect(page.locator('[data-testid="estimate-subtotal"]')).toContainText('60,000');
    await expect(page.locator('[data-testid="estimate-tax"]')).toContainText('6,000');
    await expect(page.locator('[data-testid="estimate-total"]')).toContainText('66,000');
    
    // Step 5: 通常台帳への転記
    await page.click('[data-testid="transfer-to-ledger"]');
    
    // 転記先の選択ダイアログ
    await expect(page.locator('[data-testid="transfer-dialog"]')).toBeVisible();
    await page.selectOption('[data-testid="ledger-type"]', 'maintenance'); // 補修工事台帳
    await page.click('[data-testid="confirm-transfer"]');
    
    // Step 6: 工事台帳での確認
    await page.goto('/ledgers/maintenance');
    await expect(page.locator('[data-testid="ledger-list"]')).toContainText('山田花子');
    await expect(page.locator('[data-testid="ledger-list"]')).toContainText('防水層補修工事');
    
    // 台帳詳細を開く
    await page.click('[data-testid="ledger-row-latest"]');
    
    // 転記された情報の確認
    await expect(page.locator('[data-testid="ledger-customer"]')).toContainText('山田花子');
    await expect(page.locator('[data-testid="ledger-amount"]')).toContainText('66,000');
    await expect(page.locator('[data-testid="ledger-source"]')).toContainText('アフターケア点検');
    await expect(page.locator('[data-testid="ledger-status"]')).toContainText('見積中');
  });

  test('点検履歴から過去データを参照した見積作成', async ({ page }) => {
    // Step 1: 顧客の点検履歴を表示
    await page.goto('/aftercare/customers/C001/history');
    
    // Step 2: 過去の類似案件を確認
    await expect(page.locator('[data-testid="history-list"]')).toContainText('前回の防水補修');
    await page.click('[data-testid="view-previous-estimate"]');
    
    // Step 3: 過去の見積を複製
    await page.click('[data-testid="duplicate-estimate"]');
    
    // Step 4: 金額を調整
    const priceInput = await page.locator('[data-testid="item-price-1"]');
    await priceInput.clear();
    await priceInput.fill('5500'); // 物価上昇を反映
    
    // Step 5: 新規見積として保存
    await page.click('[data-testid="save-as-new"]');
    await expect(page.locator('[data-testid="success-message"]')).toContainText('見積を作成しました');
  });

  test('緊急対応から即座に台帳作成', async ({ page }) => {
    // Step 1: 緊急対応モードへ
    await page.goto('/aftercare/emergency');
    
    // Step 2: 顧客選択と症状入力
    await page.fill('[data-testid="search-customer"]', '田中');
    await page.click('[data-testid="customer-result-1"]');
    
    await page.fill('[data-testid="emergency-description"]', '雨漏り発生');
    await page.selectOption('[data-testid="urgency"]', 'high');
    
    // Step 3: 緊急見積の作成
    await page.click('[data-testid="create-emergency-estimate"]');
    await page.fill('[data-testid="emergency-amount"]', '150000');
    
    // Step 4: 即座に工事台帳へ
    await page.click('[data-testid="create-emergency-ledger"]');
    
    // 台帳が作成され、ステータスが緊急になっていることを確認
    await expect(page).toHaveURL(/\/ledgers\/EM-\d+/);
    await expect(page.locator('[data-testid="ledger-priority"]')).toContainText('緊急');
    await expect(page.locator('[data-testid="ledger-status"]')).toContainText('着工準備');
  });
});