'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  itemCount: number;
  estimatedAmount: number;
  usageCount: number;
}

interface Step1Props {
  data: any;
  onNext: (stepData: any) => void;
  onCancel: () => void;
}

// ダミーテンプレートデータ
const mockTemplates: Template[] = [
  {
    id: 'TPL-001',
    name: '戸建住宅 外壁塗装（シリコン）',
    category: '外壁塗装',
    description: '木造2階建て住宅の外壁シリコン塗装標準プラン',
    itemCount: 12,
    estimatedAmount: 2800000,
    usageCount: 45,
  },
  {
    id: 'TPL-002',
    name: 'マンション バルコニー防水',
    category: '防水工事',
    description: 'マンションバルコニーのウレタン防水工事',
    itemCount: 8,
    estimatedAmount: 450000,
    usageCount: 23,
  },
  {
    id: 'TPL-003',
    name: 'キッチンリフォーム標準プラン',
    category: 'リフォーム',
    description: 'システムキッチン交換とクロス張替え',
    itemCount: 15,
    estimatedAmount: 1200000,
    usageCount: 67,
  },
  {
    id: 'TPL-004',
    name: '屋根瓦交換工事',
    category: '屋根工事',
    description: '和瓦から軽量瓦への交換工事',
    itemCount: 10,
    estimatedAmount: 1800000,
    usageCount: 12,
  },
];

export function Step1Template({ data, onNext, onCancel }: Step1Props) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [useTemplate, setUseTemplate] = useState<boolean>(false);

  const handleNext = () => {
    if (useTemplate && selectedTemplate) {
      const template = mockTemplates.find((t) => t.id === selectedTemplate);
      onNext({
        templateId: selectedTemplate,
        category: template?.category || '',
        title: template?.name || '',
      });
    } else {
      // 新規作成の場合
      onNext({
        templateId: undefined,
        category: '',
        title: '',
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(amount);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          テンプレート選択
        </h2>
        <p className="text-gray-600">
          既存のテンプレートを使用するか、新規で作成するかを選択してください
        </p>
      </div>

      <div className="space-y-6">
        {/* 新規作成オプション */}
        <Card
          className={`border-2 cursor-pointer transition-colors ${
            !useTemplate
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-blue-300'
          }`}
        >
          <CardContent className="p-6">
            <div
              className="flex items-center space-x-4"
              onClick={() => {
                setUseTemplate(false);
                setSelectedTemplate('');
              }}
            >
              <div
                className={`w-4 h-4 border-2 rounded-full ${
                  !useTemplate
                    ? 'bg-blue-600 border-blue-600'
                    : 'border-gray-300'
                }`}
              >
                {!useTemplate && (
                  <div className="w-2 h-2 bg-white rounded-full m-0.5" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-lg">新規作成</h3>
                <p className="text-gray-600">ゼロから新しい見積を作成します</p>
              </div>
              <div className="ml-auto">
                <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                  推奨
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* テンプレート使用オプション */}
        <Card
          className={`border-2 cursor-pointer transition-colors ${
            useTemplate
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-blue-300'
          }`}
        >
          <CardContent className="p-6">
            <div
              className="flex items-center space-x-4"
              onClick={() => setUseTemplate(true)}
            >
              <div
                className={`w-4 h-4 border-2 rounded-full ${
                  useTemplate
                    ? 'bg-blue-600 border-blue-600'
                    : 'border-gray-300'
                }`}
              >
                {useTemplate && (
                  <div className="w-2 h-2 bg-white rounded-full m-0.5" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-lg">テンプレートから作成</h3>
                <p className="text-gray-600">
                  既存のテンプレートを元に見積を作成します
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* テンプレート一覧（テンプレート使用時のみ表示） */}
        {useTemplate && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">テンプレートを選択</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mockTemplates.map((template) => (
                <Card
                  key={template.id}
                  className={`cursor-pointer transition-colors border-2 ${
                    selectedTemplate === template.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => setSelectedTemplate(template.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">
                          {template.name}
                        </CardTitle>
                        <div className="text-sm text-gray-500">
                          {template.category}
                        </div>
                      </div>
                      <div
                        className={`w-4 h-4 border-2 rounded-full ${
                          selectedTemplate === template.id
                            ? 'bg-blue-600 border-blue-600'
                            : 'border-gray-300'
                        }`}
                      >
                        {selectedTemplate === template.id && (
                          <div className="w-2 h-2 bg-white rounded-full m-0.5" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-gray-600 mb-3">
                      {template.description}
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">項目数:</span>
                        <span className="ml-1 font-medium">
                          {template.itemCount}項目
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">使用回数:</span>
                        <span className="ml-1 font-medium">
                          {template.usageCount}回
                        </span>
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className="text-gray-500 text-xs">目安金額:</span>
                      <span className="ml-1 font-semibold text-blue-600">
                        {formatCurrency(template.estimatedAmount)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* アクションボタン */}
      <div className="flex justify-between mt-8">
        <Button onClick={onCancel} variant="outline">
          キャンセル
        </Button>
        <Button
          onClick={handleNext}
          disabled={useTemplate && !selectedTemplate}
        >
          次へ（基本情報）
        </Button>
      </div>
    </div>
  );
}
