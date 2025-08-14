'use client';

import { ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { useFeatureFlag } from '@/config/featureFlags';
import { usePermissionMask, useMaskIndicator } from '@/hooks/usePermissionMask';
import type { Role } from '@/config/roleDashboard';
import { Eye, EyeOff, Shield } from 'lucide-react';

interface MaskedFieldProps {
  value: any;
  field: string;
  role: Role;
  children?: ReactNode;
  showMaskIndicator?: boolean;
  className?: string;
}

export function MaskedField({
  value,
  field,
  role,
  children,
  showMaskIndicator = true,
  className = '',
}: MaskedFieldProps) {
  const { maskValue, shouldShowField } = usePermissionMask(role);
  const { maskingEnabled, getMaskIcon } = useMaskIndicator();

  if (!shouldShowField(field, value)) {
    return null;
  }

  const maskedValue = maskValue(value, field);
  const isMasked = maskingEnabled && maskedValue !== value;

  return (
    <span className={`relative ${className}`}>
      {children ? children : maskedValue}
      {showMaskIndicator && isMasked && (
        <Badge
          variant="outline"
          className="ml-2 text-xs"
          title="この情報は権限によりマスクされています"
        >
          <Shield className="h-3 w-3 mr-1" />
          マスク
        </Badge>
      )}
    </span>
  );
}

// 数値専用のマスクコンポーネント
export function MaskedNumber({
  value,
  field,
  role,
  formatter = (n: number) => n.toLocaleString(),
  showMaskIndicator = true,
}: {
  value: number;
  field: string;
  role: Role;
  formatter?: (value: number) => string;
  showMaskIndicator?: boolean;
}) {
  const { maskValue, shouldShowField } = usePermissionMask(role);

  if (!shouldShowField(field, value)) {
    return null;
  }

  const maskedValue = maskValue(value, field);
  const displayValue =
    typeof maskedValue === 'number' ? formatter(maskedValue) : maskedValue;

  return (
    <MaskedField
      value={value}
      field={field}
      role={role}
      showMaskIndicator={showMaskIndicator}
    >
      {displayValue}
    </MaskedField>
  );
}

// 金額専用のマスクコンポーネント
export function MaskedAmount({
  value,
  field,
  role,
  currency = '¥',
  showMaskIndicator = true,
}: {
  value: number;
  field: string;
  role: Role;
  currency?: string;
  showMaskIndicator?: boolean;
}) {
  return (
    <MaskedNumber
      value={value}
      field={field}
      role={role}
      formatter={(n) => `${currency}${n.toLocaleString()}`}
      showMaskIndicator={showMaskIndicator}
    />
  );
}

// コンディショナル表示コンポーネント
export function ConditionalRender({
  field,
  role,
  children,
  fallback = null,
}: {
  field: string;
  role: Role;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { shouldShowField } = usePermissionMask(role);

  return shouldShowField(field) ? <>{children}</> : <>{fallback}</>;
}

// 権限マスク状態インジケーター
export function PermissionIndicator({ role }: { role: Role }) {
  const searchParams = useSearchParams();
  const maskingEnabled = useFeatureFlag('permission_masking', searchParams);
  const { permissionConfig } = usePermissionMask(role);

  if (!maskingEnabled) return null;

  const activeRules = permissionConfig.rules.length;

  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <Shield className="h-4 w-4" />
      <span>権限マスク有効</span>
      <Badge variant="outline" className="text-xs">
        {activeRules}項目制限
      </Badge>
    </div>
  );
}
