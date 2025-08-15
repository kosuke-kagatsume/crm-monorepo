# CSV Import Test Data

## サンプルファイル

- `sample_estimates.csv`: 見積データ（5行）
- `sample_purchase_orders.csv`: 発注データ（4行）
- `sample_bills.csv`: 請求データ（4行）

## テストデータ内容

- **PJ001**: 基礎工事・躯体工事
  - 基礎コンクリート: 50m3
  - 鉄筋: 2000kg
  - 構造用鋼材: 500本

- **PJ002**: 内装工事
  - 石膏ボード: 200枚
  - クロス: 500m2

## API エンドポイント

### プレビュー（検証のみ）

```bash
# 見積プレビュー
curl -X POST http://localhost:3000/api/imports/preview?type=estimate \
  -F "file=@seed/csv/sample_estimates.csv"

# 発注プレビュー
curl -X POST http://localhost:3000/api/imports/preview?type=po \
  -F "file=@seed/csv/sample_purchase_orders.csv"

# 請求プレビュー
curl -X POST http://localhost:3000/api/imports/preview?type=bill \
  -F "file=@seed/csv/sample_bills.csv"
```

### 確定投入

```bash
# 見積投入（tenant IDを指定）
curl -X POST http://localhost:3000/api/imports/commit?type=estimate&tenant=YOUR_TENANT_ID \
  -F "file=@seed/csv/sample_estimates.csv"

# 発注投入
curl -X POST http://localhost:3000/api/imports/commit?type=po&tenant=YOUR_TENANT_ID \
  -F "file=@seed/csv/sample_purchase_orders.csv"

# 請求投入
curl -X POST http://localhost:3000/api/imports/commit?type=bill&tenant=YOUR_TENANT_ID \
  -F "file=@seed/csv/sample_bills.csv"
```

## 期待値（手計算）

### PJ001の原価計算

- 見積売上: (18000×50) + (150×2000) + (10000×500) = 6,200,000円
- 見積原価: (15000×50) + (120×2000) + (8000×500) = 4,990,000円
- 実際原価: 725,000 + 230,000 + 3,900,000 = 4,855,000円
- 粗利益: 6,200,000 - 4,855,000 = 1,345,000円（21.7%）

### PJ002の原価計算

- 見積売上: (1200×200) + (1800×500) = 1,140,000円
- 見積原価: (800×200) + (1200×500) = 760,000円
- 実際原価: 150,000 + 550,000 = 700,000円
- 粗利益: 1,140,000 - 700,000 = 440,000円（38.6%）

## 検証手順

1. **プレビューAPI実行**

   ```bash
   cd /Users/dw100/crm-monorepo/drm-suite
   curl -X POST http://localhost:3000/api/imports/preview?type=estimate \
     -F "file=@seed/csv/sample_estimates.csv"
   ```

   期待結果: `{ total: 5, sample_ok: 5, sample_errors: 0 }`

2. **データ整合性確認**
   - 見積の品番と発注の品番が一致
   - 発注番号と請求の発注番号が一致
   - 数量の整合性

3. **粗利益計算確認**
   - PJ001: 21.7%の粗利益率
   - PJ002: 38.6%の粗利益率
