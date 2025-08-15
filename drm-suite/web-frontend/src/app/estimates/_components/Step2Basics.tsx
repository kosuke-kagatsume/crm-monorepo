'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Step2Props {
  data: any;
  onNext: (stepData: any) => void;
  onBack: () => void;
}

export function Step2Basics({ data, onNext, onBack }: Step2Props) {
  const [formData, setFormData] = useState({
    title: data.title || '',
    customerId: data.customerId || '',
    storeId: data.storeId || '',
    category: data.category || '',
    structure: data.structure || '',
    method: data.method || '',
    projectId: data.projectId || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // エラークリア
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = '見積タイトルは必須です';
    }
    if (!formData.customerId) {
      newErrors.customerId = '顧客の選択は必須です';
    }
    if (!formData.storeId) {
      newErrors.storeId = '店舗の選択は必須です';
    }
    if (!formData.category) {
      newErrors.category = '物件種別の選択は必須です';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      onNext(formData);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">基本情報</h2>
        <p className="text-gray-600">見積の基本情報を入力してください</p>
      </div>

      <div className="space-y-6">
        {/* プロジェクト連携情報 */}
        {data.projectId && (
          <Card className="bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <span className="text-blue-600">🔗</span>
                <span className="font-medium text-blue-800">案件連携中</span>
                <span className="text-blue-600">案件ID: {data.projectId}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 見積タイトル */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            見積タイトル *
          </label>
          <Input
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="〇〇様邸 外壁塗装工事"
            className={errors.title ? 'border-red-500' : ''}
          />
          {errors.title && (
            <p className="text-red-500 text-sm mt-1">{errors.title}</p>
          )}
        </div>

        {/* 顧客選択 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            顧客 *
          </label>
          <select
            value={formData.customerId}
            onChange={(e) => handleInputChange('customerId', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg ${
              errors.customerId ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">選択してください</option>
            <option value="CUST-001">山田太郎様</option>
            <option value="CUST-002">鈴木一郎様</option>
            <option value="CUST-003">田中花子様</option>
            <option value="CUST-004">佐藤次郎様</option>
            <option value="CUST-NEW">+ 新規顧客登録</option>
          </select>
          {errors.customerId && (
            <p className="text-red-500 text-sm mt-1">{errors.customerId}</p>
          )}
        </div>

        {/* 店舗選択 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            店舗 *
          </label>
          <select
            value={formData.storeId}
            onChange={(e) => handleInputChange('storeId', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg ${
              errors.storeId ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">選択してください</option>
            <option value="STORE-001">東京本店</option>
            <option value="STORE-002">大阪支店</option>
            <option value="STORE-003">名古屋支店</option>
            <option value="STORE-004">福岡支店</option>
          </select>
          {errors.storeId && (
            <p className="text-red-500 text-sm mt-1">{errors.storeId}</p>
          )}
        </div>

        {/* 物件情報 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              物件種別 *
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg ${
                errors.category ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">選択してください</option>
              <option value="戸建住宅">戸建住宅</option>
              <option value="マンション">マンション</option>
              <option value="アパート">アパート</option>
              <option value="商業施設">商業施設</option>
              <option value="工場・倉庫">工場・倉庫</option>
              <option value="リフォーム">リフォーム</option>
            </select>
            {errors.category && (
              <p className="text-red-500 text-sm mt-1">{errors.category}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              構造
            </label>
            <select
              value={formData.structure}
              onChange={(e) => handleInputChange('structure', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">選択してください</option>
              <option value="木造2階建て">木造2階建て</option>
              <option value="木造平屋">木造平屋</option>
              <option value="木造3階建て">木造3階建て</option>
              <option value="鉄骨造">鉄骨造</option>
              <option value="RC造">RC造</option>
              <option value="SRC造">SRC造</option>
            </select>
          </div>
        </div>

        {/* 工法 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            工法・施工内容
          </label>
          <Input
            value={formData.method}
            onChange={(e) => handleInputChange('method', e.target.value)}
            placeholder="シリコン塗装、瓦交換、システムキッチン交換など"
          />
        </div>

        {/* テンプレート情報（選択時のみ表示） */}
        {data.templateId && (
          <Card className="bg-green-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-green-800">
                📋 テンプレート使用
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-green-700 text-sm">
                選択したテンプレートの情報が次のステップで自動入力されます
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* アクションボタン */}
      <div className="flex justify-between mt-8">
        <Button onClick={onBack} variant="outline">
          前へ
        </Button>
        <Button onClick={handleNext}>次へ（見積項目）</Button>
      </div>
    </div>
  );
}
