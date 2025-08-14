// 8役職別ダッシュボード設定ファイル
export interface Widget {
  id: string;
  title: string;
  type: 'stats' | 'todo' | 'chart' | 'list' | 'calendar' | 'quick-actions';
  size: 'small' | 'medium' | 'large' | 'full';
  position: { row: number; col: number };
  config?: Record<string, any>;
}

export interface DashboardConfig {
  role: string;
  roleName: string;
  shortcutKeys: string[];
  widgets: Widget[];
  ragPresets: string[];
}

export const DASHBOARD_CONFIGS: Record<string, DashboardConfig> = {
  '経営者': {
    role: '経営者',
    roleName: '経営者',
    shortcutKeys: ['R'], // RAGのみ
    widgets: [
      {
        id: 'revenue-stats',
        title: '売上統計',
        type: 'stats',
        size: 'medium',
        position: { row: 0, col: 0 },
      },
      {
        id: 'project-overview',
        title: 'プロジェクト概要',
        type: 'chart',
        size: 'medium',
        position: { row: 0, col: 1 },
      },
      {
        id: 'pending-approvals',
        title: '承認待ち',
        type: 'todo',
        size: 'medium',
        position: { row: 1, col: 0 },
      },
      {
        id: 'team-performance',
        title: 'チーム成績',
        type: 'list',
        size: 'medium',
        position: { row: 1, col: 1 },
      },
    ],
    ragPresets: ['売上分析', '予算状況', 'チーム評価', '経営指標'],
  },

  '支店長': {
    role: '支店長',
    roleName: '支店長',
    shortcutKeys: ['R'],
    widgets: [
      {
        id: 'branch-stats',
        title: '支店統計',
        type: 'stats',
        size: 'medium',
        position: { row: 0, col: 0 },
      },
      {
        id: 'schedule-overview',
        title: 'スケジュール',
        type: 'calendar',
        size: 'large',
        position: { row: 0, col: 1 },
      },
      {
        id: 'staff-todo',
        title: 'スタッフToDo',
        type: 'todo',
        size: 'medium',
        position: { row: 1, col: 0 },
      },
      {
        id: 'reports',
        title: '報告書',
        type: 'list',
        size: 'medium',
        position: { row: 1, col: 1 },
      },
    ],
    ragPresets: ['支店業績', 'スタッフ状況', 'スケジュール', '報告書検索'],
  },

  '営業担当': {
    role: '営業担当',
    roleName: '営業担当',
    shortcutKeys: ['R'],
    widgets: [
      {
        id: 'sales-stats',
        title: '営業成績',
        type: 'stats',
        size: 'medium',
        position: { row: 0, col: 0 },
      },
      {
        id: 'customer-list',
        title: '顧客リスト',
        type: 'list',
        size: 'medium',
        position: { row: 0, col: 1 },
      },
      {
        id: 'follow-up',
        title: 'フォローアップ',
        type: 'todo',
        size: 'medium',
        position: { row: 1, col: 0 },
      },
      {
        id: 'appointments',
        title: 'アポイント',
        type: 'calendar',
        size: 'medium',
        position: { row: 1, col: 1 },
      },
    ],
    ragPresets: ['顧客情報', '商談履歴', '提案資料', '競合分析'],
  },

  '経理担当': {
    role: '経理担当',
    roleName: '経理担当',
    shortcutKeys: ['R'],
    widgets: [
      {
        id: 'financial-stats',
        title: '財務統計',
        type: 'stats',
        size: 'medium',
        position: { row: 0, col: 0 },
      },
      {
        id: 'invoices-pending',
        title: '請求書処理',
        type: 'todo',
        size: 'medium',
        position: { row: 0, col: 1 },
      },
      {
        id: 'cash-flow',
        title: 'キャッシュフロー',
        type: 'chart',
        size: 'medium',
        position: { row: 1, col: 0 },
      },
      {
        id: 'payment-status',
        title: '入金状況',
        type: 'list',
        size: 'medium',
        position: { row: 1, col: 1 },
      },
    ],
    ragPresets: ['請求書', '入金管理', '財務諸表', '税務処理'],
  },

  'マーケティング': {
    role: 'マーケティング',
    roleName: 'マーケティング',
    shortcutKeys: ['R'],
    widgets: [
      {
        id: 'campaign-stats',
        title: 'キャンペーン成績',
        type: 'stats',
        size: 'medium',
        position: { row: 0, col: 0 },
      },
      {
        id: 'web-analytics',
        title: 'Web解析',
        type: 'chart',
        size: 'medium',
        position: { row: 0, col: 1 },
      },
      {
        id: 'campaign-todo',
        title: 'キャンペーンToDo',
        type: 'todo',
        size: 'medium',
        position: { row: 1, col: 0 },
      },
      {
        id: 'lead-generation',
        title: 'リード獲得',
        type: 'list',
        size: 'medium',
        position: { row: 1, col: 1 },
      },
    ],
    ragPresets: ['キャンペーン分析', 'SEO状況', 'SNS運用', 'リード情報'],
  },

  '施工管理': {
    role: '施工管理',
    roleName: '施工管理',
    shortcutKeys: ['E', 'C', 'B', 'R'], // 出来高、変更工事、請求、RAG
    widgets: [
      {
        id: 'project-progress',
        title: 'プロジェクト進捗',
        type: 'stats',
        size: 'medium',
        position: { row: 0, col: 0 },
      },
      {
        id: 'site-todo',
        title: '現場ToDo',
        type: 'todo',
        size: 'medium',
        position: { row: 0, col: 1 },
      },
      {
        id: 'quality-check',
        title: '品質チェック',
        type: 'list',
        size: 'medium',
        position: { row: 1, col: 0 },
      },
      {
        id: 'safety-alerts',
        title: '安全アラート',
        type: 'list',
        size: 'medium',
        position: { row: 1, col: 1 },
      },
      {
        id: 'quick-actions',
        title: 'クイックアクション',
        type: 'quick-actions',
        size: 'full',
        position: { row: 2, col: 0 },
        config: {
          actions: [
            { key: 'E', label: '出来高入力', color: 'blue' },
            { key: 'C', label: '変更工事起票', color: 'orange' },
            { key: 'B', label: '請求案作成', color: 'green' },
          ],
        },
      },
    ],
    ragPresets: ['進捗確認', '予算状況', '安全基準', '品質管理'],
  },

  '事務員': {
    role: '事務員',
    roleName: '事務員',
    shortcutKeys: ['N', 'R'], // 新規顧客、RAG
    widgets: [
      {
        id: 'document-stats',
        title: '書類処理状況',
        type: 'stats',
        size: 'medium',
        position: { row: 0, col: 0 },
      },
      {
        id: 'daily-tasks',
        title: '日次業務',
        type: 'todo',
        size: 'medium',
        position: { row: 0, col: 1 },
      },
      {
        id: 'phone-log',
        title: '電話対応履歴',
        type: 'list',
        size: 'medium',
        position: { row: 1, col: 0 },
      },
      {
        id: 'file-management',
        title: 'ファイル管理',
        type: 'list',
        size: 'medium',
        position: { row: 1, col: 1 },
      },
      {
        id: 'quick-actions',
        title: 'クイックアクション',
        type: 'quick-actions',
        size: 'full',
        position: { row: 2, col: 0 },
        config: {
          actions: [
            { key: 'N', label: '新規顧客登録', color: 'blue' },
          ],
        },
      },
    ],
    ragPresets: ['顧客検索', '書類テンプレ', '入金状況', '契約一覧'],
  },

  'アフター担当': {
    role: 'アフター担当',
    roleName: 'アフター担当',
    shortcutKeys: ['M', 'R'], // 見積統合、RAG
    widgets: [
      {
        id: 'aftercare-stats',
        title: 'アフター対応状況',
        type: 'stats',
        size: 'medium',
        position: { row: 0, col: 0 },
      },
      {
        id: 'maintenance-todo',
        title: 'メンテナンス予定',
        type: 'todo',
        size: 'medium',
        position: { row: 0, col: 1 },
      },
      {
        id: 'warranty-list',
        title: '保証対応',
        type: 'list',
        size: 'medium',
        position: { row: 1, col: 0 },
      },
      {
        id: 'repair-requests',
        title: '修理依頼',
        type: 'list',
        size: 'medium',
        position: { row: 1, col: 1 },
      },
      {
        id: 'quick-actions',
        title: 'クイックアクション',
        type: 'quick-actions',
        size: 'full',
        position: { row: 2, col: 0 },
        config: {
          actions: [
            { key: 'M', label: '見積統合', color: 'purple' },
          ],
        },
      },
    ],
    ragPresets: ['メンテ履歴', '保証確認', '修理ガイド', '点検予定'],
  },
};