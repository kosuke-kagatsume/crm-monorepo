# DRM Suite v1.1 仕様書

## 🎯 バージョン概要

DRM Suite v1.1は、v1.0の基盤上に構築される拡張版で、以下の主要機能を追加します：

1. **アフターケアサービス** - 顧客フォローアップと保守管理
2. **元帳管理サービス** - 財務管理と会計連携
3. **経費管理の強化** - 承認ワークフローと予算管理
4. **RAG Copilotの強化** - マルチエージェント対応とコンテキスト理解の向上
5. **ダークテーマ対応** - 全画面でのダークモード完全サポート

## 📦 新規サービス詳細

### 1. svc-aftercare（アフターケアサービス）

#### 機能概要
- 保守契約管理
- 定期点検スケジューリング
- 保証期間管理
- メンテナンス履歴
- クレーム対応
- 顧客満足度調査

#### エンドポイント
```typescript
// 保守契約
POST   /api/aftercare/contracts
GET    /api/aftercare/contracts
GET    /api/aftercare/contracts/:id
PUT    /api/aftercare/contracts/:id
DELETE /api/aftercare/contracts/:id

// 定期点検
POST   /api/aftercare/inspections
GET    /api/aftercare/inspections
PUT    /api/aftercare/inspections/:id/complete

// メンテナンス記録
POST   /api/aftercare/maintenance
GET    /api/aftercare/maintenance/history/:customerId

// クレーム管理
POST   /api/aftercare/claims
GET    /api/aftercare/claims
PUT    /api/aftercare/claims/:id/resolve

// 満足度調査
POST   /api/aftercare/surveys
GET    /api/aftercare/surveys/results
```

### 2. svc-ledger（元帳管理サービス）

#### 機能概要
- 総勘定元帳
- 仕訳入力
- 試算表
- 損益計算書
- 貸借対照表
- キャッシュフロー計算書
- 会計ソフト連携（弥生会計、freee、マネーフォワード）

#### エンドポイント
```typescript
// 仕訳
POST   /api/ledger/entries
GET    /api/ledger/entries
PUT    /api/ledger/entries/:id
DELETE /api/ledger/entries/:id

// 勘定科目
GET    /api/ledger/accounts
POST   /api/ledger/accounts
PUT    /api/ledger/accounts/:id

// レポート
GET    /api/ledger/reports/trial-balance
GET    /api/ledger/reports/profit-loss
GET    /api/ledger/reports/balance-sheet
GET    /api/ledger/reports/cash-flow

// 外部連携
POST   /api/ledger/export/:format
POST   /api/ledger/import/:format
```

### 3. svc-expense 強化版

#### 追加機能
- 承認ワークフロー（多段階承認）
- 予算アラート
- 経費分析ダッシュボード
- レシート OCR連携
- 法人カード連携
- 経費精算自動化

#### 新規エンドポイント
```typescript
// 承認ワークフロー
POST   /api/expense/workflows
GET    /api/expense/workflows/:expenseId
PUT    /api/expense/workflows/:id/approve
PUT    /api/expense/workflows/:id/reject

// 予算管理
POST   /api/expense/budgets/alerts
GET    /api/expense/budgets/utilization

// OCR連携
POST   /api/expense/receipts/ocr
GET    /api/expense/receipts/:id/extracted-data

// カード連携
POST   /api/expense/cards/sync
GET    /api/expense/cards/transactions
```

## 🤖 RAG Copilot v2.0

### マルチエージェント構成

```python
# エージェント定義
agents = {
    "sales_agent": {
        "role": "営業支援",
        "capabilities": ["見積作成", "商談履歴分析", "提案書生成"]
    },
    "construction_agent": {
        "role": "施工管理支援",
        "capabilities": ["工程管理", "資材発注", "進捗レポート"]
    },
    "finance_agent": {
        "role": "財務分析",
        "capabilities": ["収支分析", "キャッシュフロー予測", "予算管理"]
    },
    "customer_agent": {
        "role": "顧客対応",
        "capabilities": ["問い合わせ対応", "クレーム分析", "満足度向上提案"]
    }
}
```

### 強化機能
- コンテキスト記憶（会話履歴の永続化）
- マルチモーダル対応（画像・PDF解析）
- リアルタイム学習（フィードバックループ）
- 業界特化知識ベース
- 予測分析機能

## 🎨 UI/UX改善

### ダークテーマ完全対応
- 全コンポーネントのダークモード対応
- システム設定連動
- カスタムカラーパレット
- アクセシビリティ考慮（WCAG 2.1 AA準拠）

### 新規画面
1. **アフターケアダッシュボード**
   - 保守契約一覧
   - 点検スケジュールカレンダー
   - クレーム対応状況
   - 顧客満足度グラフ

2. **財務ダッシュボード**
   - リアルタイム収支グラフ
   - キャッシュフロー予測
   - 勘定科目別分析
   - 月次・年次比較

3. **経費管理ダッシュボード**
   - 承認待ち一覧
   - 予算消化率
   - 部門別経費分析
   - 経費トレンド

## 🏗️ データベース拡張

### 新規テーブル

```prisma
// アフターケア関連
model MaintenanceContract {
  id            String   @id @default(cuid())
  customerId    String
  projectId     String
  startDate     DateTime
  endDate       DateTime
  contractType  String
  amount        Decimal
  status        String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Inspection {
  id            String   @id @default(cuid())
  contractId    String
  scheduledDate DateTime
  completedDate DateTime?
  inspector     String
  findings      Json
  status        String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Claim {
  id            String   @id @default(cuid())
  customerId    String
  projectId     String?
  category      String
  description   String
  severity      String
  status        String
  resolution    String?
  createdAt     DateTime @default(now())
  resolvedAt    DateTime?
}

// 元帳関連
model JournalEntry {
  id            String   @id @default(cuid())
  entryDate     DateTime
  debitAccount  String
  creditAccount String
  amount        Decimal
  description   String
  reference     String?
  status        String
  createdBy     String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Account {
  id            String   @id @default(cuid())
  code          String   @unique
  name          String
  type          String   // 資産/負債/資本/収益/費用
  parentId      String?
  balance       Decimal  @default(0)
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

// 経費管理拡張
model ApprovalWorkflow {
  id            String   @id @default(cuid())
  expenseId     String
  level         Int
  approverId    String
  status        String   // pending/approved/rejected
  comments      String?
  approvedAt    DateTime?
  createdAt     DateTime @default(now())
}

model Budget {
  id            String   @id @default(cuid())
  departmentId  String
  categoryId    String
  fiscalYear    Int
  fiscalMonth   Int
  amount        Decimal
  used          Decimal  @default(0)
  alertLevel    Int      @default(80) // %
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

## 🔄 インテグレーション

### 外部サービス連携
1. **会計ソフト連携**
   - 弥生会計 API
   - freee API
   - マネーフォワード API

2. **OCRサービス**
   - Google Vision API
   - Amazon Textract

3. **決済サービス**
   - Stripe
   - PayPay for Business

4. **通知サービス**
   - LINE Notify
   - Slack Webhook
   - Microsoft Teams

## 📊 パフォーマンス目標

- API応答時間: < 200ms (95パーセンタイル)
- ページロード時間: < 2秒
- データベースクエリ: < 50ms
- RAG応答時間: < 3秒
- 同時接続数: 1000ユーザー

## 🚀 デプロイメント計画

### フェーズ1（Week 1-2）
- svc-aftercareの基本実装
- svc-ledgerの基本実装
- データベーススキーマ更新

### フェーズ2（Week 3-4）
- svc-expense強化
- RAG Copilot v2.0実装
- 外部サービス連携

### フェーズ3（Week 5-6）
- UI/UXアップデート
- ダークテーマ実装
- パフォーマンス最適化

### フェーズ4（Week 7-8）
- 統合テスト
- 負荷テスト
- 本番デプロイ

## 📝 マイグレーション戦略

1. **データベース**
   - Prismaマイグレーション自動実行
   - バックアップ自動化
   - ロールバック手順準備

2. **API互換性**
   - v1.0 APIの完全互換維持
   - 非推奨APIの段階的廃止
   - バージョニング戦略

3. **ゼロダウンタイムデプロイ**
   - Blue-Greenデプロイメント
   - カナリアリリース
   - 段階的ロールアウト