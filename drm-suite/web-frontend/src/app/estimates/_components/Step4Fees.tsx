'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Step4Props {
  data: any;
  onNext: (stepData: any) => void;
  onBack: () => void;
}

interface Fees {
  materialFee: number;
  laborFee: number;
  transportFee: number;
  overheadRate: number;
  profitRate: number;
  discountAmount: number;
  taxRate: number;
}

export function Step4Fees({ data, onNext, onBack }: Step4Props) {
  const [fees, setFees] = useState<Fees>({
    materialFee: data.fees?.materialFee || 0,
    laborFee: data.fees?.laborFee || 0,
    transportFee: data.fees?.transportFee || 50000,
    overheadRate: data.fees?.overheadRate || 10,
    profitRate: data.fees?.profitRate || 20,
    discountAmount: data.fees?.discountAmount || 0,
    taxRate: 10, // 消費税率
  });

  // 工事費小計（前ステップから）
  const subtotal = data.totalPrice || 0;
  const subtotalCost = data.totalCost || 0;

  // 計算された値
  const [calculations, setCalculations] = useState({
    overheadAmount: 0,
    profitAmount: 0,
    preTaxTotal: 0,
    taxAmount: 0,
    finalTotal: 0,
    totalCost: 0,
    totalProfit: 0,
    profitMargin: 0,
  });

  // 計算の更新
  useEffect(() => {
    const baseAmount =
      subtotal + fees.materialFee + fees.laborFee + fees.transportFee;
    const overheadAmount = Math.floor(baseAmount * (fees.overheadRate / 100));
    const profitAmount = Math.floor(
      (baseAmount + overheadAmount) * (fees.profitRate / 100),
    );
    const preTaxTotal =
      baseAmount + overheadAmount + profitAmount - fees.discountAmount;
    const taxAmount = Math.floor(preTaxTotal * (fees.taxRate / 100));
    const finalTotal = preTaxTotal + taxAmount;

    const totalCost =
      subtotalCost +
      fees.materialFee +
      fees.laborFee +
      fees.transportFee +
      overheadAmount;
    const totalProfit = finalTotal - totalCost;
    const profitMargin = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

    setCalculations({
      overheadAmount,
      profitAmount,
      preTaxTotal,
      taxAmount,
      finalTotal,
      totalCost,
      totalProfit,
      profitMargin,
    });
  }, [fees, subtotal, subtotalCost]);

  const handleFeeChange = (field: keyof Fees, value: number) => {
    setFees((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(amount);
  };

  const handleNext = () => {
    onNext({
      fees,
      calculations,
      finalTotal: calculations.finalTotal,
      profitMargin: calculations.profitMargin,
    });
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">諸経費・合計</h2>
        <p className="text-gray-600">
          諸経費と利益率を設定して、最終見積金額を確定してください
        </p>
      </div>

      <div className="space-y-6">
        {/* 工事費小計（前ステップから） */}
        <Card className="bg-blue-50">
          <CardHeader>
            <CardTitle className="text-lg">工事費小計</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-sm text-gray-600">項目数</div>
                <div className="text-xl font-bold">
                  {data.items?.length || 0}項目
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">原価合計</div>
                <div className="text-xl font-bold text-gray-900">
                  {formatCurrency(subtotalCost)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">販売価格合計</div>
                <div className="text-xl font-bold text-blue-600">
                  {formatCurrency(subtotal)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 諸経費入力 */}
        <Card>
          <CardHeader>
            <CardTitle>諸経費</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  材料費・副資材
                </label>
                <Input
                  type="number"
                  value={fees.materialFee}
                  onChange={(e) =>
                    handleFeeChange('materialFee', Number(e.target.value))
                  }
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  労務費・管理費
                </label>
                <Input
                  type="number"
                  value={fees.laborFee}
                  onChange={(e) =>
                    handleFeeChange('laborFee', Number(e.target.value))
                  }
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  運搬費・交通費
                </label>
                <Input
                  type="number"
                  value={fees.transportFee}
                  onChange={(e) =>
                    handleFeeChange('transportFee', Number(e.target.value))
                  }
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  値引き額
                </label>
                <Input
                  type="number"
                  value={fees.discountAmount}
                  onChange={(e) =>
                    handleFeeChange('discountAmount', Number(e.target.value))
                  }
                  min="0"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 利益率設定 */}
        <Card>
          <CardHeader>
            <CardTitle>利益率設定</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  経費率 (%)
                </label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    value={fees.overheadRate}
                    onChange={(e) =>
                      handleFeeChange('overheadRate', Number(e.target.value))
                    }
                    min="0"
                    max="50"
                    step="0.1"
                  />
                  <span className="text-gray-500">%</span>
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  計算額: {formatCurrency(calculations.overheadAmount)}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  粗利率 (%)
                </label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    value={fees.profitRate}
                    onChange={(e) =>
                      handleFeeChange('profitRate', Number(e.target.value))
                    }
                    min="0"
                    max="50"
                    step="0.1"
                  />
                  <span className="text-gray-500">%</span>
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  計算額: {formatCurrency(calculations.profitAmount)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 金額計算結果 */}
        <Card className="bg-green-50">
          <CardHeader>
            <CardTitle className="text-lg text-green-800">見積金額</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">工事費小計</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">材料費・副資材</span>
                <span className="font-medium">
                  {formatCurrency(fees.materialFee)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">労務費・管理費</span>
                <span className="font-medium">
                  {formatCurrency(fees.laborFee)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">運搬費・交通費</span>
                <span className="font-medium">
                  {formatCurrency(fees.transportFee)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">
                  経費 ({fees.overheadRate}%)
                </span>
                <span className="font-medium">
                  {formatCurrency(calculations.overheadAmount)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">粗利 ({fees.profitRate}%)</span>
                <span className="font-medium">
                  {formatCurrency(calculations.profitAmount)}
                </span>
              </div>
              {fees.discountAmount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-red-600">値引き</span>
                  <span className="font-medium text-red-600">
                    -{formatCurrency(fees.discountAmount)}
                  </span>
                </div>
              )}
              <hr className="border-gray-300" />
              <div className="flex justify-between items-center">
                <span className="text-gray-700">税抜合計</span>
                <span className="font-medium">
                  {formatCurrency(calculations.preTaxTotal)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">消費税 ({fees.taxRate}%)</span>
                <span className="font-medium">
                  {formatCurrency(calculations.taxAmount)}
                </span>
              </div>
              <hr className="border-gray-400" />
              <div className="flex justify-between items-center text-lg">
                <span className="font-semibold text-green-800">税込合計</span>
                <span className="font-bold text-2xl text-green-600">
                  {formatCurrency(calculations.finalTotal)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 収益性分析 */}
        <Card className="bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-lg text-yellow-800">
              収益性分析
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-sm text-gray-600">総原価</div>
                <div className="text-xl font-bold text-gray-900">
                  {formatCurrency(calculations.totalCost)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">総粗利</div>
                <div className="text-xl font-bold text-green-600">
                  {formatCurrency(calculations.totalProfit)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">粗利率</div>
                <div
                  className={`text-xl font-bold ${
                    calculations.profitMargin >= 30
                      ? 'text-green-600'
                      : calculations.profitMargin >= 15
                        ? 'text-yellow-600'
                        : 'text-red-600'
                  }`}
                >
                  {calculations.profitMargin.toFixed(1)}%
                </div>
              </div>
            </div>

            {/* 収益性アラート */}
            {calculations.profitMargin < 15 && (
              <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg">
                <div className="flex items-center">
                  <span className="text-red-600 mr-2">⚠️</span>
                  <span className="text-red-800 text-sm font-medium">
                    粗利率が15%を下回っています。価格設定をご確認ください。
                  </span>
                </div>
              </div>
            )}

            {calculations.profitMargin >= 15 &&
              calculations.profitMargin < 25 && (
                <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-yellow-600 mr-2">📊</span>
                    <span className="text-yellow-800 text-sm font-medium">
                      適正な粗利率です。更なる改善余地があります。
                    </span>
                  </div>
                </div>
              )}

            {calculations.profitMargin >= 25 && (
              <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded-lg">
                <div className="flex items-center">
                  <span className="text-green-600 mr-2">✅</span>
                  <span className="text-green-800 text-sm font-medium">
                    優良な粗利率です。
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* アクションボタン */}
      <div className="flex justify-between mt-8">
        <Button onClick={onBack} variant="outline">
          前へ
        </Button>
        <Button onClick={handleNext}>次へ（確認・発行）</Button>
      </div>
    </div>
  );
}
