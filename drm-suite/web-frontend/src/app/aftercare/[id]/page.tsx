'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { Inspection } from '../page';

interface CheckItem {
  id: string;
  category: string;
  name: string;
  description: string;
}

const CHECK_ITEMS: CheckItem[] = [
  // 構造
  {
    id: 'structure_foundation',
    category: '構造',
    name: '基礎',
    description: 'ひび割れ、沈下、劣化の確認',
  },
  {
    id: 'structure_walls',
    category: '構造',
    name: '外壁',
    description: '亀裂、浮き、剥離の確認',
  },
  {
    id: 'structure_roof',
    category: '構造',
    name: '屋根',
    description: '破損、ずれ、劣化の確認',
  },

  // 雨漏り
  {
    id: 'leak_ceiling',
    category: '雨漏り',
    name: '天井',
    description: '染み、変色、カビの確認',
  },
  {
    id: 'leak_walls',
    category: '雨漏り',
    name: '壁面',
    description: '湿気、染み跡の確認',
  },
  {
    id: 'leak_windows',
    category: '雨漏り',
    name: '窓枠周辺',
    description: 'コーキング劣化、浸水跡の確認',
  },

  // 設備
  {
    id: 'equipment_gutter',
    category: '設備',
    name: '雨樋',
    description: '詰まり、破損、外れの確認',
  },
  {
    id: 'equipment_ventilation',
    category: '設備',
    name: '換気口',
    description: '動作、詰まり、破損の確認',
  },
  {
    id: 'equipment_drainage',
    category: '設備',
    name: '排水',
    description: '流れ、詰まり、悪臭の確認',
  },

  // 塗装
  {
    id: 'paint_peeling',
    category: '塗装',
    name: '剥離',
    description: '塗膜の剥がれ、浮きの確認',
  },
  {
    id: 'paint_chalking',
    category: '塗装',
    name: 'チョーキング',
    description: '白亜化現象の確認',
  },
  {
    id: 'paint_fading',
    category: '塗装',
    name: '色褪せ',
    description: '変色、退色の確認',
  },
];

export default function InspectionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checkResults, setCheckResults] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState('');
  const [estimateRequired, setEstimateRequired] = useState(false);

  useEffect(() => {
    fetchInspection();
  }, [params.id]);

  const fetchInspection = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/aftercare/inspections/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setInspection(data);
        // 既存の結果がある場合は復元
        if (data.result) {
          setCheckResults(data.result.checkItems || {});
          setNotes(data.result.notes || '');
          setEstimateRequired(data.result.estimateRequired || false);
        }
      }
    } catch (error) {
      console.error('Failed to fetch inspection:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!inspection) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/aftercare/inspections/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
          completedDate: new Date().toISOString(),
          result: {
            checkItems: checkResults,
            notes,
            photos: [], // DW参照リンク表示用（今回はスタブ）
            estimateRequired,
          },
        }),
      });

      if (response.ok) {
        alert('点検結果を保存しました');
        router.push('/aftercare');
      }
    } catch (error) {
      console.error('Failed to save inspection:', error);
      alert('保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleInstantEstimate = () => {
    if (!inspection) return;
    router.push(
      `/estimates/create?customerId=${inspection.customerId}&projectId=${inspection.projectId}&title=${encodeURIComponent(inspection.projectName + ' - アフター点検後見積')}`,
    );
  };

  const getInspectionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      '1M': '1ヶ月点検',
      '6M': '6ヶ月点検',
      '1Y': '1年点検',
      '2Y': '2年点検',
      '5Y': '5年点検',
      '10Y': '10年点検',
      custom: 'カスタム点検',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">点検情報が見つかりません</p>
          <Button onClick={() => router.push('/aftercare')} className="mt-4">
            一覧に戻る
          </Button>
        </div>
      </div>
    );
  }

  const groupedCheckItems = CHECK_ITEMS.reduce(
    (acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, CheckItem[]>,
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/aftercare')}
                className="text-gray-500 hover:text-gray-700"
              >
                ← アフター管理
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                🔍 点検実施票
              </h1>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleInstantEstimate}
                variant="outline"
                disabled={!estimateRequired}
              >
                💡 即時見積作成
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? '保存中...' : '✅ 点検完了'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 基本情報 */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl">
                  {inspection.customerName}
                </CardTitle>
                <p className="text-gray-600 mt-1">{inspection.projectName}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {inspection.address}
                </p>
              </div>
              <div className="text-right">
                <Badge className="mb-2">
                  {getInspectionTypeLabel(inspection.inspectionType)}
                </Badge>
                <p className="text-sm text-gray-600">
                  予定日:{' '}
                  {new Date(inspection.scheduledDate).toLocaleDateString(
                    'ja-JP',
                  )}
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* チェック項目 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>点検項目</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(groupedCheckItems).map(([category, items]) => (
                <div key={category}>
                  <h3 className="font-semibold text-lg mb-3 text-gray-700">
                    {category}
                  </h3>
                  <div className="space-y-3 pl-4">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-start space-x-3">
                        <Checkbox
                          id={item.id}
                          checked={checkResults[item.id] || false}
                          onCheckedChange={(checked) =>
                            setCheckResults((prev) => ({
                              ...prev,
                              [item.id]: checked as boolean,
                            }))
                          }
                        />
                        <div className="flex-1">
                          <Label
                            htmlFor={item.id}
                            className="font-medium cursor-pointer"
                          >
                            {item.name}
                          </Label>
                          <p className="text-sm text-gray-500 mt-0.5">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 所見・メモ */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>所見・メモ</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="点検時の所見、特記事項、お客様への連絡事項などを記入してください"
              className="min-h-[150px]"
            />
          </CardContent>
        </Card>

        {/* 写真参照 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>写真・資料</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-700">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                <span className="font-medium">DandoriWorks連携</span>
              </div>
              <p className="text-sm text-blue-600 mt-2">
                写真・資料はDandoriWorksで管理されています
              </p>
              <Button
                variant="link"
                className="text-blue-700 p-0 h-auto mt-2"
                onClick={() => alert('DandoriWorksへのリンク（スタブ）')}
              >
                📸 DandoriWorksで写真を確認 →
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 見積必要性 */}
        <Card>
          <CardHeader>
            <CardTitle>フォローアップ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-3">
              <Checkbox
                id="estimate-required"
                checked={estimateRequired}
                onCheckedChange={(checked) =>
                  setEstimateRequired(checked as boolean)
                }
              />
              <Label htmlFor="estimate-required" className="cursor-pointer">
                <span className="font-medium">
                  補修・メンテナンスの見積が必要
                </span>
                <span className="text-sm text-gray-500 ml-2">
                  （チェックすると即時見積ボタンが有効になります）
                </span>
              </Label>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
