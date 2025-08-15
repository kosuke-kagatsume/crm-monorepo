'use client';

import { ReactNode } from 'react';

interface Step {
  number: number;
  title: string;
  description: string;
}

interface WizardProps {
  steps: Step[];
  currentStep: number;
  onStepClick: (step: number) => void;
  children: ReactNode;
}

export function Wizard({
  steps,
  currentStep,
  onStepClick,
  children,
}: WizardProps) {
  return (
    <div className="space-y-8">
      {/* ステップインジケーター */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isActive = step.number === currentStep;
            const isCompleted = step.number < currentStep;
            const isClickable = step.number <= currentStep;

            return (
              <div key={step.number} className="flex items-center">
                {/* ステップ番号 */}
                <button
                  onClick={() => isClickable && onStepClick(step.number)}
                  disabled={!isClickable}
                  className={`
                    flex items-center justify-center w-10 h-10 rounded-full font-semibold text-sm
                    transition-colors duration-200
                    ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : isCompleted
                          ? 'bg-green-500 text-white cursor-pointer hover:bg-green-600'
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }
                    ${isClickable && !isActive ? 'hover:bg-blue-500 hover:text-white' : ''}
                  `}
                >
                  {isCompleted ? '✓' : step.number}
                </button>

                {/* ステップタイトル・説明 */}
                <div className="ml-4 text-left hidden md:block">
                  <div
                    className={`font-medium ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'}`}
                  >
                    {step.title}
                  </div>
                  <div className="text-sm text-gray-500">
                    {step.description}
                  </div>
                </div>

                {/* 接続線 */}
                {index < steps.length - 1 && (
                  <div
                    className={`
                    hidden md:block mx-8 h-0.5 w-16 lg:w-24
                    ${step.number < currentStep ? 'bg-green-500' : 'bg-gray-200'}
                  `}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* モバイル用のステップタイトル */}
        <div className="md:hidden mt-4 text-center">
          <div className="font-medium text-blue-600">
            {steps[currentStep - 1]?.title}
          </div>
          <div className="text-sm text-gray-500">
            {steps[currentStep - 1]?.description}
          </div>
        </div>

        {/* プログレスバー */}
        <div className="mt-6">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>
              Step {currentStep} of {steps.length}
            </span>
            <span>{Math.round((currentStep / steps.length) * 100)}% 完了</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* ステップコンテンツ */}
      <div className="bg-white rounded-lg shadow">{children}</div>
    </div>
  );
}
