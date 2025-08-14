import { NextResponse } from 'next/server';
import { getDB, updateDB } from '../../route';

// 契約書エクスポート
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const DB = getDB();
  const body = await req.json();
  const { provider } = body; // 'gmo' | 'cloudsign'
  
  const estimateIndex = DB.findIndex(est => est.id === params.id);
  
  if (estimateIndex === -1) {
    return NextResponse.json(
      { error: 'Estimate not found' },
      { status: 404 }
    );
  }
  
  const estimate = DB[estimateIndex];
  
  // 承認チェック
  if (estimate.approval?.status !== 'approved') {
    return NextResponse.json(
      { error: 'Estimate must be approved before creating contract' },
      { status: 400 }
    );
  }
  
  // プロバイダーバリデーション
  if (!provider || !['gmo', 'cloudsign'].includes(provider)) {
    return NextResponse.json(
      { error: 'Invalid contract provider' },
      { status: 400 }
    );
  }
  
  // モック：契約書生成（後でsvc-contractに差し替え）
  const contractId = `CONTRACT-${Date.now()}`;
  const contractUrl = provider === 'gmo'
    ? `https://gmo-sign.example.com/contracts/${contractId}`
    : `https://cloudsign.example.com/contracts/${contractId}`;
  
  // 見積に契約情報を追加
  const updatedEstimate = {
    ...estimate,
    contract: {
      provider: provider as 'gmo' | 'cloudsign',
      status: 'draft' as const,
      url: contractUrl,
      contractId,
      createdAt: new Date().toISOString()
    },
    updatedAt: new Date().toISOString()
  };
  
  const newDB = [...DB];
  newDB[estimateIndex] = updatedEstimate;
  updateDB(newDB);
  
  // モック：契約書データ準備
  const contractData = {
    estimateId: params.id,
    customerInfo: {
      id: estimate.customerId,
      name: `Customer-${estimate.customerId}` // 実際には顧客マスタから取得
    },
    items: estimate.versions.find(v => v.id === estimate.selectedVersionId)?.items || [],
    paymentPlan: estimate.paymentPlan,
    totalAmount: calculateTotal(updatedEstimate),
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30日後
  };
  
  console.log(`Contract created via ${provider}:`, contractData);
  
  return NextResponse.json({
    message: 'Contract export successful',
    contract: {
      id: contractId,
      provider,
      status: 'draft',
      url: contractUrl,
      estimateId: params.id,
      createdAt: new Date().toISOString()
    },
    estimate: updatedEstimate
  });
}

// 合計金額計算ヘルパー
function calculateTotal(estimate: any): number {
  const version = estimate.versions.find((v: any) => v.id === estimate.selectedVersionId);
  if (!version) return 0;
  
  const subtotal = version.items.reduce((sum: number, item: any) => 
    sum + (item.qty * item.price), 0
  );
  
  return Math.floor(subtotal * 1.1); // 税込み
}