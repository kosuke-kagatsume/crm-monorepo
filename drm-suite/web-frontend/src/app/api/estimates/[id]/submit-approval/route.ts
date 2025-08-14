import { NextResponse } from 'next/server';
import { getDB, updateDB } from '../../route';

// 承認申請
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const DB = getDB();
  const estimateIndex = DB.findIndex(est => est.id === params.id);
  
  if (estimateIndex === -1) {
    return NextResponse.json(
      { error: 'Estimate not found' },
      { status: 404 }
    );
  }
  
  const estimate = DB[estimateIndex];
  
  // ステータスチェック
  if (estimate.approval?.status !== 'draft') {
    return NextResponse.json(
      { error: 'Estimate is not in draft status' },
      { status: 400 }
    );
  }
  
  // 承認申請処理
  const updatedEstimate = {
    ...estimate,
    approval: {
      ...estimate.approval,
      status: 'pending' as const,
      submittedAt: new Date().toISOString(),
      submittedBy: 'USER-CURRENT' // 実際には認証から取得
    },
    updatedAt: new Date().toISOString()
  };
  
  const newDB = [...DB];
  newDB[estimateIndex] = updatedEstimate;
  updateDB(newDB);
  
  // モック：承認ワークフロー通知（後でsvc-workflowに差し替え）
  console.log(`Approval requested for estimate ${params.id}`);
  
  // モック：承認者への通知
  const approvers = estimate.approval?.steps.map(step => step.role) || [];
  console.log(`Notifying approvers: ${approvers.join(', ')}`);
  
  return NextResponse.json({
    message: 'Approval submission successful',
    estimate: updatedEstimate,
    workflow: {
      id: `WORKFLOW-${Date.now()}`,
      status: 'initiated',
      currentStep: 0,
      steps: estimate.approval?.steps || []
    }
  });
}