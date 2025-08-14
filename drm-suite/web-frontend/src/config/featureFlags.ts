// Feature Flag 設定
export interface FeatureFlags {
  new_estimate: boolean;
  keyboard_shortcuts: boolean; // キーボードショートカット
  permission_masking: boolean; // 権限マスク機能
  rag_citations: boolean; // RAG必須引用
  advanced_ui: boolean; // 高度なUI機能
}

// デフォルト設定（本番では慎重に変更）
export const defaultFlags: FeatureFlags = {
  new_estimate: false, // 初期はOFF、後でONに切り替え
  keyboard_shortcuts: false, // キーボードショートカット段階公開
  permission_masking: false, // 権限マスク段階公開
  rag_citations: false, // RAG引用必須段階公開
  advanced_ui: false, // 高度UI段階公開
};

// フラグを既定ONに切り替える場合はこのコメントアウトを外す
// export const defaultFlags: FeatureFlags = {
//   new_estimate: true,        // 🚀 新見積機能を本番リリース
//   keyboard_shortcuts: true,  // キーボードショートカット本番リリース
//   permission_masking: true,  // 権限マスク本番リリース
//   rag_citations: true,       // RAG引用必須本番リリース
//   advanced_ui: true,         // 高度UI本番リリース
// };

// URLパラメータからフラグを解析
export function parseFeatureFlags(searchParams: URLSearchParams): FeatureFlags {
  const flags = { ...defaultFlags };

  // ?ff=new_estimate=on のような形式をパース
  const ffParam = searchParams.get('ff');
  if (ffParam) {
    const flagPairs = ffParam.split(',');
    flagPairs.forEach((pair) => {
      const [key, value] = pair.split('=');
      if (key && value) {
        const flagKey = key.trim() as keyof FeatureFlags;
        if (flagKey in flags) {
          flags[flagKey] = value.trim().toLowerCase() === 'on';
        }
      }
    });
  }

  return flags;
}

// フラグチェック用のヘルパー関数
export function useFeatureFlag(
  flag: keyof FeatureFlags,
  searchParams: URLSearchParams,
): boolean {
  const flags = parseFeatureFlags(searchParams);
  return flags[flag];
}

// 開発用：全フラグを表示
export function debugFeatureFlags(searchParams: URLSearchParams): void {
  if (process.env.NODE_ENV === 'development') {
    const flags = parseFeatureFlags(searchParams);
    console.log('🏴 Feature Flags:', flags);
  }
}
