import { NextResponse } from 'next/server';
import { redact } from '../../../../libs/rag/mask';

interface RAGRequest {
  query: string;
  role?: string;
  context?: {
    projectId?: string | null;
    customer?: string | null;
    timestamp?: string;
  };
}

interface RAGCitation {
  docId: string;
  page: number;
  title?: string;
  excerpt?: string;
}

interface RAGResponse {
  answer: string;
  citations: RAGCitation[];
  templates?: string[];
  redactionsApplied?: boolean;
  redactedPatterns?: string[];
}

export async function POST(req: Request) {
  try {
    const { query, role = 'sales', context }: RAGRequest = await req.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'クエリが必要です' }, { status: 400 });
    }

    // プロジェクト文脈をログ出力（デバッグ用）
    if (process.env.NODE_ENV === 'development' && context) {
      console.log('RAG コンテキスト:', {
        role,
        projectId: context.projectId,
        customer: context.customer,
        query: query.substring(0, 50) + '...',
      });
    }

    // ここで実際はベクトル検索＋LLMを呼ぶ。今回はモック。
    const mock = await simulateRAGSearch(query, role, context);

    // 引用が無い場合はフォールバック（テンプレ）
    if (!mock.citations?.length) {
      return NextResponse.json({
        answer:
          '該当する文書が見つかりませんでした。よくある質問テンプレートを表示します。',
        citations: [],
        templates: [
          '見積作成の基本手順',
          '契約書テンプレート',
          '安全管理マニュアル',
          '品質管理チェックリスト',
          'よくある問い合わせ集',
        ],
      });
    }

    // マスク適用
    const redacted = redact(mock.answer, { role });

    const response: RAGResponse = {
      answer: redacted.text,
      citations: mock.citations,
      redactionsApplied: redacted.redactionsApplied,
      redactedPatterns: redacted.redactedPatterns,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('RAG API エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 },
    );
  }
}

// モック検索機能（実際の実装では外部サービス呼び出し）
async function simulateRAGSearch(
  query: string,
  role?: string,
  context?: {
    projectId?: string | null;
    customer?: string | null;
    timestamp?: string;
  },
): Promise<{
  answer: string;
  citations: RAGCitation[];
}> {
  // 1-2秒の処理時間をシミュレート
  await new Promise((resolve) =>
    setTimeout(resolve, 1000 + Math.random() * 1000),
  );

  // 20%の確率で引用なし（フォールバック発動）
  if (Math.random() < 0.2) {
    return {
      answer: '',
      citations: [],
    };
  }

  // プロジェクト文脈を考慮した回答生成
  const contextualPrefix =
    context?.projectId && context?.customer
      ? `【${context.customer}様・案件${context.projectId}】\n\n`
      : context?.customer
        ? `【${context.customer}様関連】\n\n`
        : '';

  // 役職別の回答調整
  const roleSpecificInfo =
    role === 'mgmt'
      ? '経営判断の参考として、'
      : role === 'accounting'
        ? '経理業務の観点から、'
        : role === 'sales'
          ? '営業活動において、'
          : '';

  // 機密情報を含むサンプル応答
  const answers = [
    `${contextualPrefix}${roleSpecificInfo}${query}に関して、以下の情報があります。\n\n材料費は通常150,000円程度、労務費200,000円で原価額は350,000円となります。粗利率は30%を目標としており、仕入単価を考慮した売上総利益は適正範囲内です。`,
    `${contextualPrefix}${roleSpecificInfo}${query}について説明します。\n\n基本的な原価構成は材料費60%、労務費35%、その他5%です。粗利益の確保のためには適切な価格設定が重要で、粗利率25-35%を維持する必要があります。`,
    `${contextualPrefix}${roleSpecificInfo}${query}の件でご回答します。\n\n過去の実績から、類似案件では原価率70%、粗利率30%で収支が安定しています。仕入価格の変動も考慮して価格設定を行ってください。`,
  ];

  const citationTemplates = [
    { docId: 'DOC-001', title: '施工管理マニュアル', basePage: 42 },
    { docId: 'DOC-002', title: '見積作成ガイドライン', basePage: 28 },
    { docId: 'DOC-003', title: '原価管理規程', basePage: 15 },
    { docId: 'DOC-004', title: '品質管理手順書', basePage: 67 },
    { docId: 'DOC-005', title: '安全管理マニュアル', basePage: 89 },
  ];

  // ランダムに1-3個の引用を選択
  const selectedCitations = citationTemplates
    .sort(() => Math.random() - 0.5)
    .slice(0, 1 + Math.floor(Math.random() * 2))
    .map((template) => ({
      docId: template.docId,
      page: template.basePage + Math.floor(Math.random() * 10),
      title: template.title,
      excerpt: `${query}に関連する重要な情報が記載されています...`,
    }));

  return {
    answer: answers[Math.floor(Math.random() * answers.length)],
    citations: selectedCitations,
  };
}
