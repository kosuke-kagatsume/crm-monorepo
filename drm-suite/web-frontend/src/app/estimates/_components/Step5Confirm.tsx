'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Step5Props {
  data: any;
  onSubmit: (finalData: any) => void;
  onBack: () => void;
}

export function Step5Confirm({ data, onSubmit, onBack }: Step5Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP');
  };

  const getCustomerName = (customerId: string) => {
    const customerMap: Record<string, string> = {
      'CUST-001': '山田太郎様',
      'CUST-002': '鈴木一郎様',
      'CUST-003': '田中花子様',
      'CUST-004': '佐藤次郎様',
    };
    return customerMap[customerId] || `顧客ID: ${customerId}`;
  };

  const getStoreName = (storeId: string) => {
    const storeMap: Record<string, string> = {
      'STORE-001': '東京本店',
      'STORE-002': '大阪支店',
      'STORE-003': '名古屋支店',
      'STORE-004': '福岡支店',
    };
    return storeMap[storeId] || `店舗ID: ${storeId}`;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const finalEstimate = {
        customerId: data.customerId,
        title: data.title,
        storeId: data.storeId,
        category: data.category,
        structure: data.structure,
        method: data.method,
        projectId: data.projectId,
        versions: [
          {
            id: 'v1',
            label: 'v1',
            createdAt: new Date().toISOString(),
            items: data.items || [],
          },
        ],
        selectedVersionId: 'v1',
        approval: {
          steps: [
            { role: 'manager' as const, threshold: 500000 },
            { role: 'director' as const, threshold: 1000000 },
          ],
          status: 'draft' as const,
        },
        paymentPlan: {
          depositPct: 30,
          middlePct: 40,
          finalPct: 30,
        },
        createdBy: 'USER-CURRENT',
        // 計算結果
        fees: data.fees,
        finalTotal: data.finalTotal,
        profitMargin: data.profitMargin,
      };

      await onSubmit(finalEstimate);
    } catch (error) {
      console.error('見積作成エラー:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">確認・発行</h2>
        <p className="text-gray-600">見積内容をご確認の上、発行してください</p>
      </div>

      <div className="space-y-6">
        {/* 基本情報 */}
        <Card>
          <CardHeader>
            <CardTitle>基本情報</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  見積タイトル
                </label>
                <p className="mt-1 text-lg font-semibold">{data.title}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  顧客
                </label>
                <p className="mt-1">{getCustomerName(data.customerId)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  店舗
                </label>
                <p className="mt-1">{getStoreName(data.storeId)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  物件種別
                </label>
                <p className="mt-1">{data.category}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  構造
                </label>
                <p className="mt-1">{data.structure}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  工法
                </label>
                <p className="mt-1">{data.method}</p>
              </div>
            </div>

            {data.templateId && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <span className="text-blue-600 mr-2">📋</span>
                  <span className="text-blue-800 text-sm">
                    テンプレート使用: {data.templateId}
                  </span>
                </div>
              </div>
            )}

            {data.projectId && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <span className="text-green-600 mr-2">🔗</span>
                  <span className="text-green-800 text-sm">
                    案件連携: {data.projectId}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 見積項目 */}
        <Card>
          <CardHeader>
            <CardTitle>見積項目 ({data.items?.length || 0}項目)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">項目名</th>
                    <th className="px-4 py-2 text-right">数量</th>
                    <th className="px-4 py-2 text-center">単位</th>
                    <th className="px-4 py-2 text-right">単価</th>
                    <th className="px-4 py-2 text-right">金額</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.items?.map((item: any, index: number) => (
                    <tr key={item.id}>
                      <td className="px-4 py-2">
                        <div className="font-medium">{item.name}</div>
                        {item.description && (
                          <div className="text-gray-500 text-xs">
                            {item.description}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {item.qty.toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-center">{item.unit}</td>
                      <td className="px-4 py-2 text-right">
                        ¥{item.price.toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-right font-medium">
                        {formatCurrency(item.qty * item.price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* 金額詳細 */}
        <Card className="bg-gradient-to-r from-green-50 to-blue-50">
          <CardHeader>
            <CardTitle className="text-green-800">見積金額詳細</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>工事費小計</span>
                <span className="font-medium">
                  {formatCurrency(data.totalPrice || 0)}
                </span>
              </div>
              {data.fees?.materialFee > 0 && (
                <div className="flex justify-between">
                  <span>材料費・副資材</span>
                  <span className="font-medium">
                    {formatCurrency(data.fees.materialFee)}
                  </span>
                </div>
              )}
              {data.fees?.laborFee > 0 && (
                <div className="flex justify-between">
                  <span>労務費・管理費</span>
                  <span className="font-medium">
                    {formatCurrency(data.fees.laborFee)}
                  </span>
                </div>
              )}
              {data.fees?.transportFee > 0 && (
                <div className="flex justify-between">
                  <span>運搬費・交通費</span>
                  <span className="font-medium">
                    {formatCurrency(data.fees.transportFee)}
                  </span>
                </div>
              )}
              {data.calculations?.overheadAmount > 0 && (
                <div className="flex justify-between">
                  <span>経費 ({data.fees?.overheadRate}%)</span>
                  <span className="font-medium">
                    {formatCurrency(data.calculations.overheadAmount)}
                  </span>
                </div>
              )}
              {data.calculations?.profitAmount > 0 && (
                <div className="flex justify-between">
                  <span>粗利 ({data.fees?.profitRate}%)</span>
                  <span className="font-medium">
                    {formatCurrency(data.calculations.profitAmount)}
                  </span>
                </div>
              )}
              {data.fees?.discountAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-red-600">値引き</span>
                  <span className="font-medium text-red-600">
                    -{formatCurrency(data.fees.discountAmount)}
                  </span>
                </div>
              )}
              <hr className="border-gray-300" />
              <div className="flex justify-between">
                <span>税抜合計</span>
                <span className="font-medium">
                  {formatCurrency(data.calculations?.preTaxTotal || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>消費税 (10%)</span>
                <span className="font-medium">
                  {formatCurrency(data.calculations?.taxAmount || 0)}
                </span>
              </div>
              <hr className="border-gray-400 border-2" />
              <div className="flex justify-between text-xl pt-2">
                <span className="font-bold text-green-800">税込合計</span>
                <span className="font-bold text-2xl text-green-600">
                  {formatCurrency(data.finalTotal || 0)}
                </span>
              </div>
            </div>

            {/* 収益性表示 */}
            <div className="mt-6 pt-4 border-t border-gray-300">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">粗利率</span>
                <Badge
                  className={`${
                    data.profitMargin >= 30
                      ? 'bg-green-100 text-green-800'
                      : data.profitMargin >= 15
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                  }`}
                >
                  {data.profitMargin?.toFixed(1)}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 支払い条件 */}
        <Card>
          <CardHeader>
            <CardTitle>支払い条件</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-sm text-gray-500">着工金</div>
                <div className="text-lg font-semibold">30%</div>
                <div className="text-sm text-green-600">
                  {formatCurrency(Math.floor((data.finalTotal || 0) * 0.3))}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">中間金</div>
                <div className="text-lg font-semibold">40%</div>
                <div className="text-sm text-green-600">
                  {formatCurrency(Math.floor((data.finalTotal || 0) * 0.4))}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">完成金</div>
                <div className="text-lg font-semibold">30%</div>
                <div className="text-sm text-green-600">
                  {formatCurrency(Math.floor((data.finalTotal || 0) * 0.3))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 注意事項 */}
        <Card className="bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800">発行前の確認事項</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <span className="text-green-600 mr-2">✓</span>
                <span>見積内容・金額に間違いがないか確認済み</span>
              </div>
              <div className="flex items-center">
                <span className="text-green-600 mr-2">✓</span>
                <span>顧客情報・連絡先が正確であることを確認済み</span>
              </div>
              <div className="flex items-center">
                <span className="text-green-600 mr-2">✓</span>
                <span>粗利率が適正範囲内であることを確認済み</span>
              </div>
              <div className="flex items-center">
                <span className="text-green-600 mr-2">✓</span>
                <span>材料・在庫の確保状況を事前に確認済み</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* アクションボタン */}
      <div className="flex justify-between mt-8">
        <Button onClick={onBack} variant="outline" disabled={isSubmitting}>
          前へ
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="bg-green-600 hover:bg-green-700 text-white px-8"
        >
          {isSubmitting ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
              作成中...
            </div>
          ) : (
            '見積を作成する'
          )}
        </Button>
      </div>
    </div>
  );
}
