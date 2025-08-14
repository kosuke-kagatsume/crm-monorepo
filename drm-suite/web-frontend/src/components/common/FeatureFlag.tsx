'use client';

import { ReactNode } from 'react';
import { isFlagOn, type FlagName } from '@/config/featureFlags';

interface FeatureFlagProps {
  flag: FlagName;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Feature Flag コンポーネント
 * フラグが有効な場合のみ子要素を表示
 */
export function FeatureFlag({
  flag,
  children,
  fallback = null,
}: FeatureFlagProps) {
  const isEnabled = isFlagOn(flag);

  return isEnabled ? <>{children}</> : <>{fallback}</>;
}

/**
 * 新見積システム用フラグ
 */
export function NewEstimateFlag({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <FeatureFlag flag="new_estimate" fallback={fallback}>
      {children}
    </FeatureFlag>
  );
}

/**
 * 新ダッシュボード用フラグ
 */
export function NewDashFlag({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <FeatureFlag flag="new_dash" fallback={fallback}>
      {children}
    </FeatureFlag>
  );
}

/**
 * フラグの状態をテキストで表示（デバッグ用）
 */
export function FlagDebugger({ flag }: { flag: FlagName }) {
  if (process.env.NODE_ENV !== 'development') return null;

  const isEnabled = isFlagOn(flag);
  return (
    <span
      className={`inline-block px-2 py-1 text-xs rounded ${
        isEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
      }`}
    >
      {flag}: {isEnabled ? 'ON' : 'OFF'}
    </span>
  );
}
