'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface EstimateItem {
  id: string;
  name: string;
  description: string;
  qty: number;
  unit: string;
  cost: number;
  price: number;
  margin: number;
}

interface Step3Props {
  data: any;
  onNext: (stepData: any) => void;
  onBack: () => void;
}

export function Step3Items({ data, onNext, onBack }: Step3Props) {
  const [items, setItems] = useState<EstimateItem[]>(data.items || []);

  // テンプレートが選択されている場合、初期項目を設定
  useEffect(() => {
    if (data.templateId && items.length === 0) {
      const templateItems = getTemplateItems(data.templateId);
      setItems(templateItems);
    }
  }, [data.templateId]);

  const getTemplateItems = (templateId: string): EstimateItem[] => {
    // テンプレートごとの項目データ（実際はAPIから取得）
    const templates: Record<string, EstimateItem[]> = {
      'TPL-001': [
        {
          id: '1',
          name: '外壁高圧洗浄',
          description: '高圧洗浄機による外壁清掃',
          qty: 150,
          unit: 'm²',
          cost: 200,
          price: 400,
          margin: 100,
        },
        {
          id: '2',
          name: 'シーリング打替え',
          description: '既存シーリング撤去・新規打設',
          qty: 80,
          unit: 'm',
          cost: 800,
          price: 1500,
          margin: 87.5,
        },
        {
          id: '3',
          name: '外壁下塗り',
          description: 'シーラー塗装',
          qty: 150,
          unit: 'm²',
          cost: 500,
          price: 900,
          margin: 80,
        },
        {
          id: '4',
          name: '外壁中塗り',
          description: 'シリコン塗料中塗り',
          qty: 150,
          unit: 'm²',
          cost: 800,
          price: 1400,
          margin: 75,
        },
        {
          id: '5',
          name: '外壁上塗り',
          description: 'シリコン塗料上塗り',
          qty: 150,
          unit: 'm²',
          cost: 800,
          price: 1400,
          margin: 75,
        },
      ],
      'TPL-002': [
        {
          id: '1',
          name: '既存防水撤去',
          description: 'バルコニー既存防水材撤去',
          qty: 25,
          unit: 'm²',
          cost: 800,
          price: 1200,
          margin: 50,
        },
        {
          id: '2',
          name: 'プライマー塗布',
          description: 'ウレタン防水用プライマー',
          qty: 25,
          unit: 'm²',
          cost: 300,
          price: 600,
          margin: 100,
        },
        {
          id: '3',
          name: 'ウレタン防水',
          description: 'ウレタン防水材2回塗り',
          qty: 25,
          unit: 'm²',
          cost: 1200,
          price: 2000,
          margin: 66.7,
        },
      ],
    };
    return templates[templateId] || [];
  };

  const addItem = () => {
    const newItem: EstimateItem = {
      id: Date.now().toString(),
      name: '',
      description: '',
      qty: 1,
      unit: 'm²',
      cost: 0,
      price: 0,
      margin: 0,
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const updateItem = (
    id: string,
    field: keyof EstimateItem,
    value: string | number,
  ) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };

          // 原価または単価が変更された場合、粗利率を再計算
          if (field === 'cost' || field === 'price') {
            const cost = field === 'cost' ? Number(value) : updated.cost;
            const price = field === 'price' ? Number(value) : updated.price;
            updated.margin = cost > 0 ? ((price - cost) / cost) * 100 : 0;
          }

          return updated;
        }
        return item;
      }),
    );
  };

  const calculateTotals = () => {
    const totalCost = items.reduce(
      (sum, item) => sum + item.qty * item.cost,
      0,
    );
    const totalPrice = items.reduce(
      (sum, item) => sum + item.qty * item.price,
      0,
    );
    const avgMargin =
      totalCost > 0 ? ((totalPrice - totalCost) / totalCost) * 100 : 0;

    return { totalCost, totalPrice, avgMargin };
  };

  const { totalCost, totalPrice, avgMargin } = calculateTotals();

  const handleNext = () => {
    if (items.length === 0) {
      alert('最低1つの項目を追加してください');
      return;
    }

    const hasEmptyItems = items.some(
      (item) => !item.name.trim() || item.price <= 0,
    );
    if (hasEmptyItems) {
      alert('全ての項目の名称と単価を入力してください');
      return;
    }

    onNext({
      items,
      totalCost,
      totalPrice,
    });
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">見積項目</h2>
        <p className="text-gray-600">
          工事項目の詳細と原価・販売価格を設定してください
        </p>
      </div>

      {/* 項目一覧 */}
      <div className="space-y-4 mb-6">
        {items.map((item, index) => (
          <Card key={item.id} className="border">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base">項目 {index + 1}</CardTitle>
                <Button
                  onClick={() => removeItem(item.id)}
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                >
                  削除
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    項目名 *
                  </label>
                  <Input
                    value={item.name}
                    onChange={(e) =>
                      updateItem(item.id, 'name', e.target.value)
                    }
                    placeholder="工事項目名"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    説明
                  </label>
                  <Input
                    value={item.description}
                    onChange={(e) =>
                      updateItem(item.id, 'description', e.target.value)
                    }
                    placeholder="詳細説明"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    数量
                  </label>
                  <Input
                    type="number"
                    value={item.qty}
                    onChange={(e) =>
                      updateItem(item.id, 'qty', Number(e.target.value))
                    }
                    min="0"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    単位
                  </label>
                  <select
                    value={item.unit}
                    onChange={(e) =>
                      updateItem(item.id, 'unit', e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="m²">m²</option>
                    <option value="m">m</option>
                    <option value="個">個</option>
                    <option value="式">式</option>
                    <option value="枚">枚</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    原価単価
                  </label>
                  <Input
                    type="number"
                    value={item.cost}
                    onChange={(e) =>
                      updateItem(item.id, 'cost', Number(e.target.value))
                    }
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    販売単価 *
                  </label>
                  <Input
                    type="number"
                    value={item.price}
                    onChange={(e) =>
                      updateItem(item.id, 'price', Number(e.target.value))
                    }
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    粗利率
                  </label>
                  <div className="px-3 py-2 bg-gray-50 rounded-lg text-center">
                    <span
                      className={`font-medium ${item.margin >= 30 ? 'text-green-600' : item.margin >= 15 ? 'text-yellow-600' : 'text-red-600'}`}
                    >
                      {item.margin.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* 項目合計 */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">原価合計:</span>
                    <span className="ml-2 font-medium">
                      {formatCurrency(item.qty * item.cost)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">販売合計:</span>
                    <span className="ml-2 font-medium">
                      {formatCurrency(item.qty * item.price)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">粗利:</span>
                    <span className="ml-2 font-medium text-green-600">
                      {formatCurrency(
                        item.qty * item.price - item.qty * item.cost,
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 項目追加ボタン */}
      <div className="text-center mb-6">
        <Button onClick={addItem} variant="outline" className="w-full max-w-md">
          + 項目を追加
        </Button>
      </div>

      {/* 小計 */}
      <Card className="bg-blue-50">
        <CardHeader>
          <CardTitle className="text-lg">工事費小計</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-sm text-gray-600">原価合計</div>
              <div className="text-xl font-bold text-gray-900">
                {formatCurrency(totalCost)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">販売価格合計</div>
              <div className="text-xl font-bold text-blue-600">
                {formatCurrency(totalPrice)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">平均粗利率</div>
              <div
                className={`text-xl font-bold ${avgMargin >= 30 ? 'text-green-600' : avgMargin >= 15 ? 'text-yellow-600' : 'text-red-600'}`}
              >
                {avgMargin.toFixed(1)}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* アクションボタン */}
      <div className="flex justify-between mt-8">
        <Button onClick={onBack} variant="outline">
          前へ
        </Button>
        <Button onClick={handleNext}>次へ（諸経費・合計）</Button>
      </div>
    </div>
  );
}
