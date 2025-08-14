import type { Role } from './roleDashboard';

export type KPIItem = {
  id: string;
  label: string;
  fmt?: 'currency' | 'percent' | 'int';
  // 式はバックエンド or フロントの計算キー。まずはダミーキーでOK
  formulaKey: string; // 例: 'sales.thisMonth', 'grossMargin.rate'
  hint?: string;
};

export type TableColumn = {
  key: string; // データキー
  label: string; // 見出し
  width?: number; // 任意
  fmt?: 'currency' | 'percent' | 'int' | 'text' | 'date' | 'status';
  mask?: 'cost' | 'gross'; // 権限マスク対象
};

export type TableDef = {
  id: string;
  title: string;
  sourceKey: string; // APIソース識別（stubでもOK）
  columns: TableColumn[];
  pageSize?: number;
};

export type RagPreset = { title: string; prompt: string };

export type RoleWidgetSpec = {
  kpis?: KPIItem[];
  tables?: TableDef[];
  rag?: RagPreset[];
};

export const WIDGET_SPECS: Record<Role, RoleWidgetSpec> = {
  // 1) 経営（mgmt）
  mgmt: {
    kpis: [
      {
        id: 'sales_mtd',
        label: '今月売上',
        fmt: 'currency',
        formulaKey: 'monthly_revenue',
        hint: '当月確定売上（税抜）',
      },
      {
        id: 'gm_rate',
        label: '粗利率',
        fmt: 'percent',
        formulaKey: 'gross_margin_rate',
      },
      {
        id: 'cash',
        label: '手持ち資金',
        fmt: 'currency',
        formulaKey: 'cash_on_hand',
      },
      {
        id: 'ar_overdue',
        label: '回収遅延(件)',
        fmt: 'int',
        formulaKey: 'overdue_receivables_count',
      },
    ],
    tables: [
      {
        id: 'branch_perf',
        title: '拠点別パフォーマンス',
        sourceKey: 'branch.performance',
        columns: [
          { key: 'branch', label: '拠点', fmt: 'text' },
          { key: 'sales', label: '売上', fmt: 'currency' },
          { key: 'gmRate', label: '粗利率', fmt: 'percent', mask: 'gross' },
          { key: 'overdue', label: '回収遅延', fmt: 'int' },
          { key: 'trend', label: 'トレンド', fmt: 'text' },
        ],
      },
      {
        id: 'alerts',
        title: '重要アラート',
        sourceKey: 'alerts.critical',
        columns: [
          { key: 'type', label: '種類', fmt: 'text' },
          { key: 'target', label: '対象', fmt: 'text' },
          { key: 'impact', label: '影響', fmt: 'text' },
          { key: 'due', label: '期限', fmt: 'date' },
          { key: 'owner', label: '担当', fmt: 'text' },
        ],
      },
    ],
    rag: [
      {
        title: '粗利乖離TOP5',
        prompt:
          '今月の粗利乖離TOP5の案件と要因を、引用＋ページ番号付きで示して。',
      },
      {
        title: '支店別改善幅',
        prompt:
          '支店別の改善幅が大きいKPIを列挙し、裏付け資料を引用付きで提示して。',
      },
    ],
  },

  // 2) 支店長（branch）
  branch: {
    kpis: [
      {
        id: 'gm_rate',
        label: '粗利率',
        fmt: 'percent',
        formulaKey: 'gross_margin_rate',
      },
      {
        id: 'contracts_mtd',
        label: '今月契約数',
        fmt: 'int',
        formulaKey: 'monthly_contracts',
      },
      {
        id: 'approvals',
        label: '承認待ち',
        fmt: 'int',
        formulaKey: 'pending_approvals',
      },
      {
        id: 'delays',
        label: '遅延案件',
        fmt: 'int',
        formulaKey: 'delayed_projects',
      },
    ],
    tables: [
      {
        id: 'approvals_today',
        title: '本日の承認待ち',
        sourceKey: 'approvals.today',
        columns: [
          { key: 'project', label: '案件', fmt: 'text' },
          { key: 'type', label: '種別', fmt: 'text' },
          { key: 'amount', label: '金額', fmt: 'currency', mask: 'cost' },
          { key: 'requestedBy', label: '申請者', fmt: 'text' },
          { key: 'due', label: '期限', fmt: 'date' },
        ],
      },
      {
        id: 'team_load',
        title: 'チーム負荷',
        sourceKey: 'team.load',
        columns: [
          { key: 'member', label: '担当', fmt: 'text' },
          { key: 'inProgress', label: '進行中', fmt: 'int' },
          { key: 'overdue', label: '期限超過', fmt: 'int' },
          { key: 'nextSlot', label: '次の空き', fmt: 'date' },
        ],
      },
    ],
    rag: [
      {
        title: '未承認請求',
        prompt:
          '未承認請求が多い案件を抽出し、影響額と背景資料を引用付きで教えて。',
      },
      {
        title: '人員配置',
        prompt:
          '人員が足りない曜日と時間帯を示し、過去実績の引用で根拠を出して。',
      },
    ],
  },

  // 3) 営業（sales）
  sales: {
    kpis: [
      {
        id: 'leads_today',
        label: '本日の新規反響',
        fmt: 'int',
        formulaKey: 'daily_leads',
      },
      {
        id: 'quotes_due',
        label: '見積提出期限',
        fmt: 'int',
        formulaKey: 'quote_deadlines',
      },
      {
        id: 'visit_today',
        label: '本日の来店予定',
        fmt: 'int',
        formulaKey: 'daily_visits',
      },
    ],
    tables: [
      {
        id: 'pipeline',
        title: 'パイプライン',
        sourceKey: 'sales.pipeline',
        columns: [
          { key: 'customer', label: '顧客', fmt: 'text' },
          { key: 'stage', label: 'ステージ', fmt: 'status' },
          { key: 'quoteDue', label: '見積期限', fmt: 'date' },
          { key: 'amount', label: '想定売上', fmt: 'currency' },
        ],
      },
    ],
    rag: [
      {
        title: '類似見積テンプレ',
        prompt: 'この顧客に近い成約案件の見積テンプレを引用付きで提案して。',
      },
      {
        title: '価格レンジ',
        prompt: '該当カテゴリの最近の価格レンジを引用ページ番号付きで。',
      },
    ],
  },

  // 4) 経理（accounting）
  accounting: {
    kpis: [
      {
        id: 'sales_mtd',
        label: '今月売上',
        fmt: 'currency',
        formulaKey: 'monthly_revenue',
      },
      {
        id: 'ar',
        label: '未収金',
        fmt: 'currency',
        formulaKey: 'accounts_receivable',
      },
      {
        id: 'due_this_week',
        label: '今週入金予定',
        fmt: 'currency',
        formulaKey: 'weekly_collections',
      },
    ],
    tables: [
      {
        id: 'invoice_list',
        title: '請求書一覧',
        sourceKey: 'ar.invoices',
        columns: [
          { key: 'invoiceNo', label: '請求番号', fmt: 'text', width: 120 },
          { key: 'customer', label: '顧客', fmt: 'text', width: 120 },
          { key: 'amount', label: '金額', fmt: 'currency', width: 100 },
          { key: 'due', label: '期日', fmt: 'date', width: 90 },
          { key: 'status', label: '状態', fmt: 'status', width: 80 },
        ],
      },
      {
        id: 'cashflow',
        title: 'キャッシュフロー',
        sourceKey: 'cash.flow',
        columns: [
          { key: 'date', label: '日付', fmt: 'date', width: 90 },
          { key: 'in', label: '入金', fmt: 'currency', width: 100 },
          { key: 'out', label: '出金', fmt: 'currency', width: 100 },
          { key: 'balance', label: '残高', fmt: 'currency', width: 110 },
        ],
      },
      {
        id: 'dunning',
        title: '督促状況',
        sourceKey: 'ar.dunning',
        columns: [
          { key: 'customer', label: '顧客', fmt: 'text', width: 120 },
          { key: 'amount', label: '滞留額', fmt: 'currency', width: 100 },
          { key: 'aging', label: '滞留日数', fmt: 'int', width: 80 },
          {
            key: 'lastAction',
            label: '最終アクション',
            fmt: 'text',
            width: 120,
          },
        ],
      },
    ],
    rag: [
      {
        title: '保留金解放予定',
        prompt:
          '今月の保留金解放予定と根拠資料（契約/出来高）を引用付きでまとめて。',
      },
      {
        title: '滞留債権の年齢別',
        prompt:
          '滞留債権の年齢別内訳（30/60/90/120+）と回収見込みを引用付きで。',
      },
    ],
  },

  // 5) マーケ（marketing）
  marketing: {
    kpis: [
      {
        id: 'visits',
        label: '訪問数',
        fmt: 'int',
        formulaKey: 'website_visits',
      },
      {
        id: 'conv',
        label: 'CV率',
        fmt: 'percent',
        formulaKey: 'conversion_rate',
      },
      {
        id: 'cpa',
        label: 'CPA',
        fmt: 'currency',
        formulaKey: 'cost_per_acquisition',
      },
    ],
    tables: [
      {
        id: 'channels',
        title: 'チャネル別効果',
        sourceKey: 'ads.channels',
        columns: [
          { key: 'channel', label: 'チャネル', fmt: 'text' },
          { key: 'spend', label: '費用', fmt: 'currency' },
          { key: 'leads', label: '反響', fmt: 'int' },
          { key: 'cpa', label: 'CPA', fmt: 'currency' },
          { key: 'roas', label: 'ROAS', fmt: 'percent' },
        ],
      },
      {
        id: 'geo',
        title: '地図分析（エリア別CV）',
        sourceKey: 'ads.geo',
        columns: [
          { key: 'area', label: 'エリア', fmt: 'text' },
          { key: 'leads', label: '反響', fmt: 'int' },
          { key: 'cvRate', label: 'CV率', fmt: 'percent' },
        ],
      },
    ],
    rag: [
      {
        title: 'イベント別CPA',
        prompt: 'イベント別CPAの推移を引用付きで示し、改善提案を出して。',
      },
      {
        title: '媒体最適化',
        prompt: '媒体ごとの最適予算配分を、実績の引用とともに提案して。',
      },
    ],
  },

  // 6) 施工管理（foreman）
  foreman: {
    kpis: [
      {
        id: 'sites_today',
        label: '今日の現場',
        fmt: 'int',
        formulaKey: 'active_sites',
      },
      {
        id: 'progress_avg',
        label: '平均進捗%',
        fmt: 'percent',
        formulaKey: 'average_progress',
      },
      {
        id: 'earned',
        label: '累計出来高',
        fmt: 'currency',
        formulaKey: 'earned_value',
      },
      {
        id: 'unapproved',
        label: '未承認請求',
        fmt: 'currency',
        formulaKey: 'unapproved_billing',
      },
    ],
    tables: [
      {
        id: 'site_cards',
        title: '現場サマリー',
        sourceKey: 'sites.summary',
        columns: [
          { key: 'site', label: '現場', fmt: 'text' },
          { key: 'progress', label: '進捗', fmt: 'percent' },
          { key: 'earned', label: '出来高', fmt: 'currency' },
          { key: 'pending', label: '承認待ち', fmt: 'currency' },
          { key: 'risk', label: 'リスク', fmt: 'text' },
        ],
      },
    ],
    rag: [
      {
        title: '外注単価レンジ',
        prompt: '外壁足場など同工種の最近の外注単価レンジを引用付きで。',
      },
      {
        title: '出来高推移',
        prompt: '同規模案件の出来高推移と原価差異を、引用ページ番号付きで。',
      },
    ],
  },

  // 7) 事務（clerk）
  clerk: {
    kpis: [
      {
        id: 'sla',
        label: '平均初動応答時間',
        fmt: 'int',
        formulaKey: 'avg_response_time_minutes',
      },
      {
        id: 'unreplied',
        label: '当日未返信',
        fmt: 'int',
        formulaKey: 'unreplied_today',
      },
      {
        id: 'satisfaction',
        label: '受付満足度',
        fmt: 'int',
        formulaKey: 'customer_satisfaction',
      },
    ],
    tables: [
      {
        id: 'queue',
        title: '受付キュー（SLA順）',
        sourceKey: 'reception.queue',
        columns: [
          { key: 'customer', label: '顧客', fmt: 'text' },
          { key: 'purpose', label: '目的', fmt: 'text' },
          { key: 'sla', label: '残SLA(分)', fmt: 'int' },
          { key: 'room', label: '商談室', fmt: 'text' },
          { key: 'car', label: '車両', fmt: 'text' },
        ],
      },
      {
        id: 'dup',
        title: '重複警告',
        sourceKey: 'customers.duplicates',
        columns: [
          { key: 'name', label: '氏名', fmt: 'text' },
          { key: 'phone', label: '電話', fmt: 'text' },
          { key: 'address', label: '住所', fmt: 'text' },
          { key: 'score', label: '類似度', fmt: 'percent' },
        ],
      },
    ],
    rag: [
      {
        title: '初期ヒアリング5項目',
        prompt:
          '外壁塗装の初期ヒアリングで必ず聞くべき5項目を引用付きでサマリして。',
      },
      {
        title: '受付→来店率',
        prompt: '受付から来店に繋がる率を上げる施策を、引用付きで提示して。',
      },
    ],
  },

  // 8) アフター（aftercare）
  aftercare: {
    kpis: [
      {
        id: 'inspections',
        label: '今週点検',
        fmt: 'int',
        formulaKey: 'weekly_inspections',
      },
      {
        id: 'defects',
        label: '是正保留',
        fmt: 'int',
        formulaKey: 'pending_defects',
      },
      { id: 'cs', label: '満足度(NPS)', fmt: 'int', formulaKey: 'nps_score' },
    ],
    tables: [
      {
        id: 'schedule',
        title: '点検スケジュール',
        sourceKey: 'after.schedule',
        columns: [
          { key: 'date', label: '日付', fmt: 'date' },
          { key: 'customer', label: '顧客', fmt: 'text' },
          { key: 'type', label: '点検種別', fmt: 'text' },
          { key: 'status', label: '状態', fmt: 'status' },
        ],
      },
      {
        id: 'followups',
        title: 'フォローアップ',
        sourceKey: 'after.followups',
        columns: [
          { key: 'case', label: '案件', fmt: 'text' },
          { key: 'next', label: '次アクション', fmt: 'text' },
          { key: 'owner', label: '担当', fmt: 'text' },
          { key: 'due', label: '期限', fmt: 'date' },
        ],
      },
    ],
    rag: [
      {
        title: '同型設備の不具合',
        prompt: '同型設備の過去不具合→原因→対処→再発防止を引用付きで提示して。',
      },
      {
        title: '見積化テンプレ',
        prompt:
          '点検から見積化する際のテンプレ手順と注意点を、引用ページ番号付きで。',
      },
    ],
  },
};
