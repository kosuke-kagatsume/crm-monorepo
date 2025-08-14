# DRM Suite v1.0 見積モジュール - 次スプリント移行メモ

## 🔄 本実装への差し替え対象

### 1. Route Handlers → 本API移行

**現在:**

```typescript
// /src/app/api/estimates/route.ts
// インメモリDB + モックデータ
const estimatesDB = [...]; // 3件のサンプル見積
```

**移行先:**

```typescript
// API Gateway経由でsvc-estimateマイクロサービス
const apiGatewayUrl = process.env.API_GATEWAY_URL;
const estimateServiceUrl = `${apiGatewayUrl}/estimates`;
```

**影響範囲:**

- `/src/app/api/estimates/` 配下の全Route Handlers
- `/src/lib/api/estimateClient.ts` のエンドポイント設定
- 認証トークン・API Key管理の追加

---

### 2. 在庫予約API → svc-inventory連携

**現在:**

```typescript
// /src/app/api/estimates/[id]/book-stock/route.ts
// SKU-KIT-001不足をハードコードでシミュレーション
const mockShortage = { sku: 'SKU-KIT-001', shortage: 5 };
```

**移行先:**

```typescript
// svc-inventory実API連携
const inventoryApi = `${apiGatewayUrl}/inventory/reserve`;
const response = await fetch(inventoryApi, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ estimateId, items }),
});
```

**影響範囲:**

- `/src/components/estimate/StockBooking.tsx` - リアルタイム在庫チェック
- 倉庫選択・SKU検索の実データ連携
- 在庫不足時の代替品提案機能

---

### 3. 契約ドラフト → GMO/CloudSign実API

**現在:**

```typescript
// /src/app/api/estimates/[id]/export-contract/route.ts
// 契約書PDF生成をシミュレーション
const mockContract = { id: 'CONTRACT-001', status: 'draft' };
```

**移行先:**

```typescript
// GMO Sign / CloudSign実API統合
const gmoSignApi = process.env.GMO_SIGN_API_URL;
const cloudSignApi = process.env.CLOUDSIGN_API_URL;

// 選択されたプロバイダーに応じて分岐
const contractApi = provider === 'gmo' ? gmoSignApi : cloudSignApi;
```

**影響範囲:**

- `/src/components/estimate/ContractExport.tsx` - 実契約書テンプレート選択
- Webhook受信エンドポイント追加 (`/api/webhooks/contract-signed`)
- 電子署名完了時の見積ステータス自動更新

---

### 4. 承認フロー → 会社別ポリシー管理

**現在:**

```typescript
// /src/components/estimate/ApprovalFlow.tsx
// 固定の3段階承認（マネージャー→役員→CFO）
const approvalSteps = [
  { role: 'manager', threshold: 1000000 },
  { role: 'director', threshold: 5000000 },
  { role: 'cfo', threshold: 10000000 },
];
```

**移行先:**

```typescript
// 会社別・店舗別の承認ポリシー管理UI
const approvalPolicyApi = `${apiGatewayUrl}/approval-policies`;
const policy = await fetchApprovalPolicy(storeId, estimateAmount);
```

**影響範囲:**

- 承認ポリシー管理画面の新規追加 (`/admin/approval-policies`)
- 金額閾値・承認者ロールの動的設定
- 休暇・代理承認者設定機能

---

### 5. RAG → ベクトルDB本格実装

**現在:**

```typescript
// /src/components/dashboard/RAGPanel.tsx
// 1秒待機後にダミー結果を返す
await new Promise(resolve => setTimeout(resolve, 1000));
const mockResult = { content: '検索結果...', citations: [...] };
```

**移行先:**

```typescript
// ベクトルDB (Pinecone/Weaviate) + 既存チャンク設定
const ragApi = `${apiGatewayUrl}/rag/search`;
const searchParams = {
  query: userQuery,
  chunkSize: 512, // tokens
  maxFileSize: 2 * 1024 * 1024, // 2MB
  maskPolicy: await getUserMaskPolicy(userId),
};
```

**影響範囲:**

- `/src/components/estimate/RAGSuggest.tsx` - リアルタイム提案
- 引用元ドキュメントの実ファイルパス・権限チェック
- マスクポリシー適用（機密情報の自動マスキング）
- ゼロ件時の見積テンプレート検索精度向上

---

## 🛠️ 技術的な移行手順

### Phase 1: API統合基盤

1. API Gateway認証設定
2. マイクロサービス間通信の設定
3. エラーハンドリング・リトライ機能

### Phase 2: サービス別移行

1. svc-estimate API統合（最優先）
2. svc-inventory在庫連携
3. GMO/CloudSign契約API統合

### Phase 3: 管理機能拡張

1. 承認ポリシー管理UI
2. RAGベクトルDB統合
3. マスクポリシー設定UI

---

## 📝 移行時の注意点

### データマイグレーション

- 現在のモックデータ → 実データベースへの移行計画
- 見積履歴・承認履歴の保持

### パフォーマンス考慮

- API レスポンス時間の最適化
- ファイルアップロード・ダウンロードの非同期処理
- RAG検索結果のキャッシュ戦略

### セキュリティ強化

- API Key・トークンの安全な管理
- ファイルアクセス権限の厳格化
- 監査ログの実装

---

## 🎯 移行完了の判定基準

### 機能テスト

- [ ] E2EフローがPRD環境で実API経由で動作
- [ ] レスポンス時間 < 3秒を維持
- [ ] エラー率 < 1%を達成

### セキュリティテスト

- [ ] 権限チェックが全API間で機能
- [ ] マスクポリシーが適切に適用
- [ ] 監査ログが完全に記録

### パフォーマンステスト

- [ ] 同時接続100ユーザーでの負荷テスト
- [ ] ファイルアップロード（2MB）が10秒以内
- [ ] RAG検索が5秒以内で結果返却

---

_このドキュメントは次スプリントでの実装チームへの引き継ぎ資料です_
