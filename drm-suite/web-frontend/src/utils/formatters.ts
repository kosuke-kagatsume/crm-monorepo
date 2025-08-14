// データフォーマット関数

export type FormatType =
  | 'currency'
  | 'percent'
  | 'int'
  | 'text'
  | 'date'
  | 'status';

// 通貨フォーマット（日本円）
export function formatCurrency(
  value: number | string | null | undefined,
): string {
  if (value === null || value === undefined || value === '') return '—';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '—';

  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0,
  }).format(num);
}

// パーセントフォーマット
export function formatPercent(
  value: number | string | null | undefined,
): string {
  if (value === null || value === undefined || value === '') return '—';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '—';

  return new Intl.NumberFormat('ja-JP', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(num / 100);
}

// 整数フォーマット
export function formatInt(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—';
  const num = typeof value === 'string' ? parseInt(value) : value;
  if (isNaN(num)) return '—';

  return new Intl.NumberFormat('ja-JP').format(num);
}

// テキストフォーマット
export function formatText(value: string | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return String(value);
}

// 日付フォーマット
export function formatDate(value: string | Date | null | undefined): string {
  if (value === null || value === undefined) return '—';

  try {
    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) return '—';

    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    }).format(date);
  } catch {
    return '—';
  }
}

// ステータスフォーマット（バッジ用）
export function formatStatus(value: string | null | undefined): {
  text: string;
  variant: 'default' | 'success' | 'warning' | 'danger' | 'info';
} {
  if (value === null || value === undefined) {
    return { text: '—', variant: 'default' };
  }

  const status = String(value).toLowerCase();

  // ステータス別のスタイル定義
  const statusMap: Record<
    string,
    {
      text: string;
      variant: 'default' | 'success' | 'warning' | 'danger' | 'info';
    }
  > = {
    // 承認関連
    approved: { text: '承認済み', variant: 'success' },
    pending: { text: '承認待ち', variant: 'warning' },
    rejected: { text: '却下', variant: 'danger' },
    draft: { text: '下書き', variant: 'default' },

    // 進捗関連
    completed: { text: '完了', variant: 'success' },
    in_progress: { text: '進行中', variant: 'info' },
    delayed: { text: '遅延', variant: 'danger' },
    scheduled: { text: '予定', variant: 'default' },

    // 支払い関連
    paid: { text: '支払済', variant: 'success' },
    unpaid: { text: '未払い', variant: 'warning' },
    overdue: { text: '期限超過', variant: 'danger' },

    // 契約関連
    signed: { text: '契約締結', variant: 'success' },
    sent: { text: '送信済', variant: 'info' },
    negotiating: { text: '交渉中', variant: 'warning' },

    // 営業ステージ
    lead: { text: 'リード', variant: 'default' },
    qualified: { text: '有望', variant: 'info' },
    proposal: { text: '提案', variant: 'warning' },
    contract: { text: '契約', variant: 'success' },

    // アフターケア
    inspection: { text: '点検', variant: 'info' },
    maintenance: { text: 'メンテナンス', variant: 'warning' },
    repair: { text: '修理', variant: 'danger' },
    warranty: { text: '保証', variant: 'success' },
  };

  return statusMap[status] || { text: String(value), variant: 'default' };
}

// 統合フォーマット関数
export function formatValue(
  value: any,
  format: FormatType | undefined,
):
  | string
  | {
      text: string;
      variant: 'default' | 'success' | 'warning' | 'danger' | 'info';
    } {
  switch (format) {
    case 'currency':
      return formatCurrency(value);
    case 'percent':
      return formatPercent(value);
    case 'int':
      return formatInt(value);
    case 'text':
      return formatText(value);
    case 'date':
      return formatDate(value);
    case 'status':
      return formatStatus(value);
    default:
      return formatText(value);
  }
}

// KPI用の追加フォーマット関数
export function formatKPIValue(
  value: any,
  format: FormatType | undefined,
): string {
  const formatted = formatValue(value, format);

  // ステータス形式の場合はテキスト部分のみ返す
  if (typeof formatted === 'object' && 'text' in formatted) {
    return formatted.text;
  }

  return String(formatted);
}

// 数値の変化トレンド表示用
export function formatTrend(
  current: number,
  previous: number,
): {
  value: string;
  direction: 'up' | 'down' | 'flat';
  percentage: string;
} {
  if (previous === 0) {
    return {
      value: formatKPIValue(current, 'int'),
      direction: 'flat',
      percentage: '—',
    };
  }

  const change = current - previous;
  const percentage = (change / previous) * 100;

  return {
    value: formatKPIValue(current, 'int'),
    direction: change > 0 ? 'up' : change < 0 ? 'down' : 'flat',
    percentage: `${percentage > 0 ? '+' : ''}${percentage.toFixed(1)}%`,
  };
}
