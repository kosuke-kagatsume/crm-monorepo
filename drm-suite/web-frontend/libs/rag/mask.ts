// RAGのマスク（テキスト赤入れ）

export type MaskContext = {
  role: string;
};

// 機密情報検出パターン
const SENSITIVE_PATTERNS = [
  /\b原価[額費]?[：:\s]*[0-9,]+(?:\.\d+)?\b/g,
  /\b粗利(?:率)?[：:\s]*[0-9.,]+%?\b/g,
  /\b仕入(?:単価|価格)?[：:\s]*[0-9,]+(?:\.\d+)?\b/g,
  /\b材料費[：:\s]*[0-9,]+(?:\.\d+)?\b/g,
  /\b労務費[：:\s]*[0-9,]+(?:\.\d+)?\b/g,
  /\b経費[：:\s]*[0-9,]+(?:\.\d+)?\b/g,
  /\bコスト[：:\s]*[0-9,]+(?:\.\d+)?\b/g,
  /\b利益率[：:\s]*[0-9.,]+%?\b/g,
  /\b売上総利益[：:\s]*[0-9,]+(?:\.\d+)?\b/g,
  /\b営業利益[：:\s]*[0-9,]+(?:\.\d+)?\b/g,
];

export interface RedactionResult {
  text: string;
  redactionsApplied: boolean;
  redactedPatterns: string[];
}

export function redact(text: string, ctx: MaskContext): RedactionResult {
  // 会社一律の非表示ロール
  const disallow = ['sales', 'clerk', 'aftercare'];

  if (!disallow.includes(ctx.role)) {
    return {
      text,
      redactionsApplied: false,
      redactedPatterns: [],
    };
  }

  let redacted = text;
  const redactedPatterns: string[] = [];

  for (const pattern of SENSITIVE_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) {
      redactedPatterns.push(...matches);
      redacted = redacted.replace(pattern, '［非表示：権限がありません］');
    }
  }

  return {
    text: redacted,
    redactionsApplied: redacted !== text,
    redactedPatterns,
  };
}

// RAG応答の最終整形用
export function maskRAGResponse(
  answerText: string,
  role: string,
  options?: {
    logRedactions?: boolean;
    customPatterns?: RegExp[];
  },
): RedactionResult {
  const patterns = options?.customPatterns
    ? [...SENSITIVE_PATTERNS, ...options.customPatterns]
    : SENSITIVE_PATTERNS;

  const result = redact(answerText, { role });

  if (options?.logRedactions && result.redactionsApplied) {
    console.log(`🔒 RAG応答マスク適用 [${role}]:`, {
      redactedCount: result.redactedPatterns.length,
      patterns: result.redactedPatterns,
    });
  }

  return result;
}

// 開発用：マスクテスト
export function testMaskPatterns(): void {
  if (process.env.NODE_ENV === 'development') {
    const testText = `
      材料費: 150,000円
      原価額: 200,000円
      粗利率: 35.5%
      仕入単価: 5,000円
      売上総利益: 180,000円
    `;

    const restrictedResult = redact(testText, { role: 'sales' });
    const allowedResult = redact(testText, { role: 'mgmt' });

    console.log('🧪 マスクテスト結果:');
    console.log('制限ロール(sales):', restrictedResult.text);
    console.log('許可ロール(mgmt):', allowedResult.text);
  }
}
