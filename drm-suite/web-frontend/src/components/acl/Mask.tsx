'use client';

import { ReactNode } from 'react';
import { PERMISSIONS, Role } from '@/config/permissions';

interface MaskProps {
  role: Role;
  can: keyof (typeof PERMISSIONS)['mgmt'];
  children: ReactNode;
  fallback?: ReactNode;
}

export function Mask({ role, can, children, fallback = '—' }: MaskProps) {
  return PERMISSIONS[role][can] ? <>{children}</> : <>{fallback}</>;
}

// 原価表示用の便利コンポーネント
export function CostMask({
  role,
  children,
  ...props
}: {
  role: Role;
  children: ReactNode;
}) {
  return (
    <Mask role={role} can="canViewCost" fallback="［非表示］" {...props}>
      {children}
    </Mask>
  );
}

// 粗利表示用の便利コンポーネント
export function GrossMarginMask({
  role,
  children,
  ...props
}: {
  role: Role;
  children: ReactNode;
}) {
  return (
    <Mask role={role} can="canViewGrossMargin" fallback="［非表示］" {...props}>
      {children}
    </Mask>
  );
}

// 承認ボタン用の便利コンポーネント
export function ApprovalMask({
  role,
  children,
  ...props
}: {
  role: Role;
  children: ReactNode;
}) {
  return (
    <Mask role={role} can="canApprove" fallback={null} {...props}>
      {children}
    </Mask>
  );
}

// 経理エクスポート用の便利コンポーネント
export function AccountingExportMask({
  role,
  children,
  ...props
}: {
  role: Role;
  children: ReactNode;
}) {
  return (
    <Mask role={role} can="canExportAccounting" fallback={null} {...props}>
      {children}
    </Mask>
  );
}
