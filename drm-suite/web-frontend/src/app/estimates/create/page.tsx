'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { isFlagOn } from '@/config/featureFlags';
import { FlagDebugger } from '@/components/common/FeatureFlag';
import { Wizard } from '../_components/Wizard';
import { Step1Template } from '../_components/Step1Template';
import { Step2Basics } from '../_components/Step2Basics';
import { Step3Items } from '../_components/Step3Items';
import { Step4Fees } from '../_components/Step4Fees';
import { Step5Confirm } from '../_components/Step5Confirm';

interface EstimateData {
  templateId?: string;
  customerId: string;
  title: string;
  storeId: string;
  method: string;
  structure: string;
  category: string;
  projectId?: string;
  items: Array<{
    id: string;
    name: string;
    description: string;
    qty: number;
    unit: string;
    cost: number;
    price: number;
  }>;
  fees: {
    materialFee: number;
    laborFee: number;
    transportFee: number;
    overheadRate: number;
    profitRate: number;
  };
  totalCost: number;
  totalPrice: number;
  profitMargin: number;
}

function CreateEstimateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const newEstimateEnabled = isFlagOn('new_estimate');

  const [currentStep, setCurrentStep] = useState(1);
  const [estimateData, setEstimateData] = useState<EstimateData>({
    customerId: '',
    title: '',
    storeId: '',
    method: '',
    structure: '',
    category: '',
    projectId: searchParams.get('projectId') || '',
    items: [],
    fees: {
      materialFee: 0,
      laborFee: 0,
      transportFee: 0,
      overheadRate: 10,
      profitRate: 20,
    },
    totalCost: 0,
    totalPrice: 0,
    profitMargin: 0,
  });

  // Feature Flag チェック
  if (!newEstimateEnabled) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-6xl mb-4">🚀</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              新見積ウィザード
            </h1>
            <p className="text-gray-600 mb-6">
              この機能は段階公開中です。Feature Flag
              を有効にして利用してください。
            </p>
            {process.env.NODE_ENV === 'development' && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <FlagDebugger flag="new_estimate" />
              </div>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => router.push('/estimates')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                見積一覧に戻る
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const updateEstimateData = (newData: Partial<EstimateData>) => {
    setEstimateData((prev) => ({
      ...prev,
      ...newData,
    }));
  };

  const handleStepComplete = (stepData: any) => {
    updateEstimateData(stepData);
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleStepBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinalSubmit = async (finalData: EstimateData) => {
    try {
      const response = await fetch('/api/estimates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalData),
      });

      if (!response.ok) throw new Error('Failed to create estimate');

      const result = await response.json();
      router.push(`/estimates/${result.id}`);
    } catch (error) {
      console.error('Failed to create estimate:', error);
      alert('見積の作成に失敗しました');
    }
  };

  const steps = [
    {
      number: 1,
      title: 'テンプレート選択',
      description: '既存テンプレートまたは新規作成',
    },
    { number: 2, title: '基本情報', description: '顧客・案件情報の入力' },
    { number: 3, title: '見積項目', description: '工事項目と原価・単価設定' },
    { number: 4, title: '諸経費・合計', description: '経費計算と粗利確認' },
    { number: 5, title: '確認・発行', description: '内容確認と見積発行' },
  ];

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1Template
            data={estimateData}
            onNext={handleStepComplete}
            onCancel={() => router.push('/estimates')}
          />
        );
      case 2:
        return (
          <Step2Basics
            data={estimateData}
            onNext={handleStepComplete}
            onBack={handleStepBack}
          />
        );
      case 3:
        return (
          <Step3Items
            data={estimateData}
            onNext={handleStepComplete}
            onBack={handleStepBack}
          />
        );
      case 4:
        return (
          <Step4Fees
            data={estimateData}
            onNext={handleStepComplete}
            onBack={handleStepBack}
          />
        );
      case 5:
        return (
          <Step5Confirm
            data={estimateData}
            onSubmit={handleFinalSubmit}
            onBack={handleStepBack}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/estimates')}
                className="text-gray-500 hover:text-gray-700"
              >
                ← 見積一覧
              </button>
              <h1 className="text-2xl font-bold text-gray-900">新規見積作成</h1>
              {process.env.NODE_ENV === 'development' && (
                <FlagDebugger flag="new_estimate" />
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Wizard
          steps={steps}
          currentStep={currentStep}
          onStepClick={(step) => {
            // 完了済みのステップのみクリック可能
            if (step <= currentStep) {
              setCurrentStep(step);
            }
          }}
        >
          {renderCurrentStep()}
        </Wizard>
      </main>
    </div>
  );
}

export default function CreateEstimatePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">読み込み中...</p>
          </div>
        </div>
      }
    >
      <CreateEstimateContent />
    </Suspense>
  );
}
