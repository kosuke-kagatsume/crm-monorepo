// 役職ごとのダッシュ構成（順番＝表示順）
export type Role =
  | 'mgmt'        // 経営
  | 'branch'      // 支店長
  | 'sales'       // 営業
  | 'accounting'  // 経理
  | 'marketing'   // マーケ
  | 'foreman'     // 施工管理
  | 'clerk'       // 事務員
  | 'aftercare';  // アフター

export type WidgetId =
  | 'kpi'             // KPIカード（役職別中身）
  | 'alerts'          // アラート/注意喚起
  | 'todo'            // 今日やること
  | 'projectsSnap'    // 案件スナップ/進捗カード
  | 'reception'       // 受付カウンターUI
  | 'booking'         // 商談室/車両の空き状況
  | 'ledgerActions'   // 出来高/CO/請求ボタン
  | 'accountingPanel' // 請求/入金/督促まとめ
  | 'marketingPanel'  // 媒体/CPA/キャンペーン
  | 'aftercareFlow'   // 点検→是正見積→台帳合流
  | 'ragToggle';      // RAGのトグルボタン

export const roleConfig: Record<Role, { widgets: WidgetId[] }> = {
  mgmt:      { widgets: ['kpi','alerts','projectsSnap','ragToggle'] },
  branch:    { widgets: ['kpi','todo','projectsSnap','ragToggle'] },
  sales:     { widgets: ['alerts','todo','projectsSnap','ragToggle'] },
  accounting:{ widgets: ['kpi','accountingPanel','ragToggle'] },
  marketing: { widgets: ['kpi','marketingPanel','ragToggle'] },
  foreman:   { widgets: ['kpi','todo','ledgerActions','ragToggle'] },
  clerk:     { widgets: ['reception','booking','todo','ragToggle'] },
  aftercare: { widgets: ['aftercareFlow','todo','ragToggle'] },
};

// 既存ログイン役職名 → 新Role型のマッピング
export const roleMapping: Record<string, Role> = {
  '経営者': 'mgmt',
  '支店長': 'branch', 
  '営業担当': 'sales',
  '経理担当': 'accounting',
  'マーケティング': 'marketing',
  '施工管理': 'foreman',
  '事務員': 'clerk',
  'アフター担当': 'aftercare',
};

// 役職表示名
export const roleDisplayNames: Record<Role, string> = {
  mgmt: '経営',
  branch: '支店長',
  sales: '営業',
  accounting: '経理',
  marketing: 'マーケティング',
  foreman: '施工管理',
  clerk: '事務員',
  aftercare: 'アフター担当',
};

// ショートカットキー設定
export const roleShortcuts: Record<Role, string[]> = {
  mgmt: ['R'],
  branch: ['R'],
  sales: ['R'],
  accounting: ['R'],
  marketing: ['R'],
  foreman: ['E', 'C', 'B', 'R'], // 出来高、変更工事、請求、RAG
  clerk: ['N', 'R'],             // 新規顧客、RAG
  aftercare: ['M', 'R'],         // 見積統合、RAG
};

// RAGプリセットクエリ（役職別）
export const ragPresets: Record<Role, string[]> = {
  mgmt: [
    '今月の売上・利益状況',
    '案件別利益率ランキング',
    '支店別パフォーマンス',
    '見積テンプレート検索'
  ],
  branch: [
    '今日のタスク一覧',
    'チーム別実績',
    '重要顧客情報',
    '見積テンプレート検索'
  ],
  sales: [
    '本日の商談予定',
    '案件進捗確認',
    '提案資料テンプレート',
    '見積テンプレート検索'
  ],
  accounting: [
    '未収金一覧',
    '支払予定確認',
    '経費精算ステータス',
    '見積原価率分析'
  ],
  marketing: [
    'キャンペーン効果測定',
    'リード獲得コスト',
    '媒体別パフォーマンス',
    '見積成約率分析'
  ],
  foreman: [
    '本日の現場スケジュール',
    '安全チェックリスト',
    '資材在庫確認',
    '施工手順テンプレート'
  ],
  clerk: [
    '本日の受付予定',
    '顧客情報検索',
    '書類テンプレート',
    '見積テンプレート検索'
  ],
  aftercare: [
    '点検スケジュール',
    '保証期限確認',
    'メンテナンス履歴',
    '見積テンプレート検索'
  ]
};