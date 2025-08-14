'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// import { Switch } from '@/components/ui/switch'; // 代替実装を使用
import {
  parseFeatureFlags,
  defaultFlags,
  type FeatureFlags,
} from '@/config/featureFlags';
import { Settings, Flag, Shield, Eye, BookOpen, Zap } from 'lucide-react';

const flagDescriptions: Record<
  keyof FeatureFlags,
  {
    title: string;
    description: string;
    icon: JSX.Element;
    risk: 'low' | 'medium' | 'high';
  }
> = {
  new_estimate: {
    title: '新見積機能',
    description: '新しい見積作成・管理機能を有効化',
    icon: <Zap className="h-4 w-4" />,
    risk: 'medium',
  },
  keyboard_shortcuts: {
    title: 'キーボードショートカット',
    description: 'ホーム画面・見積画面でのキーボード操作',
    icon: <Settings className="h-4 w-4" />,
    risk: 'low',
  },
  permission_masking: {
    title: '権限マスク',
    description: '役職に応じた情報表示制限機能',
    icon: <Shield className="h-4 w-4" />,
    risk: 'high',
  },
  rag_citations: {
    title: 'RAG必須引用',
    description: 'RAG検索結果の引用・ページ番号必須表示',
    icon: <BookOpen className="h-4 w-4" />,
    risk: 'medium',
  },
  advanced_ui: {
    title: '高度UI機能',
    description: '高度なユーザーインターフェース機能',
    icon: <Eye className="h-4 w-4" />,
    risk: 'low',
  },
};

export function FeatureFlagPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentFlags, setCurrentFlags] = useState<FeatureFlags>(defaultFlags);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const flags = parseFeatureFlags(searchParams);
    setCurrentFlags(flags);
  }, [searchParams]);

  const updateFlag = (flag: keyof FeatureFlags, enabled: boolean) => {
    const newFlags = { ...currentFlags, [flag]: enabled };
    setCurrentFlags(newFlags);
    setHasChanges(true);
  };

  const applyFlags = () => {
    const enabledFlags = Object.entries(currentFlags)
      .filter(([_, enabled]) => enabled)
      .map(([flag, _]) => `${flag}=on`)
      .join(',');

    const currentPath = window.location.pathname;
    const newUrl = enabledFlags
      ? `${currentPath}?ff=${enabledFlags}`
      : currentPath;

    router.push(newUrl);
    setHasChanges(false);
  };

  const resetFlags = () => {
    setCurrentFlags(defaultFlags);
    router.push(window.location.pathname);
    setHasChanges(false);
  };

  const enableAll = () => {
    const allEnabled = Object.keys(defaultFlags).reduce((acc, key) => {
      acc[key as keyof FeatureFlags] = true;
      return acc;
    }, {} as FeatureFlags);
    setCurrentFlags(allEnabled);
    setHasChanges(true);
  };

  const getRiskBadge = (risk: 'low' | 'medium' | 'high') => {
    const variants = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800',
    };
    const labels = {
      low: '低リスク',
      medium: '中リスク',
      high: '高リスク',
    };
    return (
      <Badge className={`text-xs ${variants[risk]}`}>{labels[risk]}</Badge>
    );
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-blue-600" />
            <CardTitle>Feature Flag 制御パネル</CardTitle>
          </div>
          <div className="flex gap-2">
            {hasChanges && (
              <Button size="sm" onClick={applyFlags}>
                設定を適用
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={resetFlags}>
              リセット
            </Button>
            <Button size="sm" variant="outline" onClick={enableAll}>
              全て有効
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* 現在のURL表示 */}
          <div className="p-3 bg-gray-50 rounded border">
            <p className="text-xs text-gray-600 mb-1">
              現在のFeature Flag URL:
            </p>
            <code className="text-xs font-mono break-all">
              {window.location.href}
            </code>
          </div>

          {/* フラグ一覧 */}
          <div className="grid gap-4">
            {Object.entries(flagDescriptions).map(([flag, config]) => (
              <div
                key={flag}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-1">{config.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{config.title}</h3>
                      {getRiskBadge(config.risk)}
                      <Badge variant="outline" className="text-xs font-mono">
                        {flag}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      {config.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant={
                      currentFlags[flag as keyof FeatureFlags]
                        ? 'default'
                        : 'outline'
                    }
                  >
                    {currentFlags[flag as keyof FeatureFlags] ? 'ON' : 'OFF'}
                  </Badge>
                  <Button
                    variant={
                      currentFlags[flag as keyof FeatureFlags]
                        ? 'default'
                        : 'outline'
                    }
                    size="sm"
                    onClick={() =>
                      updateFlag(
                        flag as keyof FeatureFlags,
                        !currentFlags[flag as keyof FeatureFlags],
                      )
                    }
                    className="h-8 w-16 text-xs"
                  >
                    {currentFlags[flag as keyof FeatureFlags] ? 'ON' : 'OFF'}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* 段階公開シナリオ */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-medium text-blue-900 mb-2">
              📋 推奨段階公開シナリオ
            </h3>
            <div className="space-y-2 text-sm text-blue-800">
              <div>
                <strong>Phase 1:</strong> keyboard_shortcuts, advanced_ui
              </div>
              <div>
                <strong>Phase 2:</strong> new_estimate, rag_citations
              </div>
              <div>
                <strong>Phase 3:</strong> permission_masking
              </div>
            </div>
          </div>

          {/* テスト用URL生成 */}
          <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <h3 className="font-medium text-green-900 mb-2">
              🧪 テスト用URL例
            </h3>
            <div className="space-y-2 text-xs font-mono">
              <div>
                基本テスト:{' '}
                <code>?ff=keyboard_shortcuts=on,advanced_ui=on</code>
              </div>
              <div>
                見積テスト: <code>?ff=new_estimate=on,rag_citations=on</code>
              </div>
              <div>
                フル機能:{' '}
                <code>
                  ?ff=new_estimate=on,keyboard_shortcuts=on,permission_masking=on,rag_citations=on,advanced_ui=on
                </code>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
