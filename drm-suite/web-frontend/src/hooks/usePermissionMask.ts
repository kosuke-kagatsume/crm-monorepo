'use client';

import { useSearchParams } from 'next/navigation';
import { useFeatureFlag } from '@/config/featureFlags';
import type { Role } from '@/config/roleDashboard';

export interface MaskRule {
  field: string;
  condition: (role: Role, data: any) => boolean;
  maskType: 'hide' | 'redact' | 'partial';
  replacement?: string;
}

export interface PermissionConfig {
  role: Role;
  rules: MaskRule[];
}

// 役職別の権限設定
export const permissionConfigs: PermissionConfig[] = [
  {
    role: 'mgmt',
    rules: [], // 経営者は全て見える
  },
  {
    role: 'branch',
    rules: [
      {
        field: 'personalInfo.phone',
        condition: () => false, // 支店長は電話番号見える
        maskType: 'hide',
      },
    ],
  },
  {
    role: 'sales',
    rules: [
      {
        field: 'cost',
        condition: () => true, // 営業は原価情報をマスク
        maskType: 'redact',
        replacement: '***',
      },
      {
        field: 'profit',
        condition: () => true,
        maskType: 'hide',
      },
    ],
  },
  {
    role: 'accounting',
    rules: [
      {
        field: 'personalInfo.address',
        condition: () => true, // 経理は住所の詳細をマスク
        maskType: 'partial',
      },
    ],
  },
  {
    role: 'marketing',
    rules: [
      {
        field: 'cost',
        condition: () => true,
        maskType: 'hide',
      },
      {
        field: 'profit',
        condition: () => true,
        maskType: 'hide',
      },
    ],
  },
  {
    role: 'foreman',
    rules: [
      {
        field: 'cost',
        condition: () => true,
        maskType: 'redact',
        replacement: '非表示',
      },
      {
        field: 'customerInfo.income',
        condition: () => true,
        maskType: 'hide',
      },
    ],
  },
  {
    role: 'clerk',
    rules: [
      {
        field: 'cost',
        condition: () => true,
        maskType: 'hide',
      },
      {
        field: 'profit',
        condition: () => true,
        maskType: 'hide',
      },
      {
        field: 'personalInfo.income',
        condition: () => true,
        maskType: 'hide',
      },
    ],
  },
  {
    role: 'aftercare',
    rules: [
      {
        field: 'cost',
        condition: () => true,
        maskType: 'partial',
      },
      {
        field: 'customerInfo.income',
        condition: () => true,
        maskType: 'hide',
      },
    ],
  },
];

export function usePermissionMask(role: Role) {
  const searchParams = useSearchParams();
  const maskingEnabled = useFeatureFlag('permission_masking', searchParams);

  const getPermissionConfig = (): PermissionConfig => {
    return (
      permissionConfigs.find((config) => config.role === role) || {
        role,
        rules: [],
      }
    );
  };

  const maskValue = (value: any, field: string): any => {
    if (!maskingEnabled) return value;

    const config = getPermissionConfig();
    const rule = config.rules.find((r) => r.field === field);

    if (!rule || !rule.condition(role, value)) {
      return value;
    }

    switch (rule.maskType) {
      case 'hide':
        return null;
      case 'redact':
        return rule.replacement || '***';
      case 'partial':
        if (typeof value === 'string') {
          if (value.length <= 4) return '***';
          return (
            value.substring(0, 2) + '***' + value.substring(value.length - 2)
          );
        }
        if (typeof value === 'number') {
          return '***';
        }
        return value;
      default:
        return value;
    }
  };

  const maskObject = (obj: any, prefix = ''): any => {
    if (!maskingEnabled) return obj;
    if (!obj || typeof obj !== 'object') return obj;

    const masked = { ...obj };

    Object.keys(masked).forEach((key) => {
      const fieldPath = prefix ? `${prefix}.${key}` : key;

      if (typeof masked[key] === 'object' && masked[key] !== null) {
        masked[key] = maskObject(masked[key], fieldPath);
      } else {
        masked[key] = maskValue(masked[key], fieldPath);
      }
    });

    return masked;
  };

  const shouldShowField = (field: string, data?: any): boolean => {
    if (!maskingEnabled) return true;

    const config = getPermissionConfig();
    const rule = config.rules.find((r) => r.field === field);

    if (!rule) return true;
    if (!rule.condition(role, data)) return true;

    return rule.maskType !== 'hide';
  };

  return {
    maskingEnabled,
    maskValue,
    maskObject,
    shouldShowField,
    permissionConfig: getPermissionConfig(),
  };
}

// マスク状態を表示するヘルパーコンポーネント用
export function useMaskIndicator() {
  const searchParams = useSearchParams();
  const maskingEnabled = useFeatureFlag('permission_masking', searchParams);

  return {
    maskingEnabled,
    getMaskIcon: (maskType: MaskRule['maskType']) => {
      switch (maskType) {
        case 'hide':
          return '🚫';
        case 'redact':
          return '📝';
        case 'partial':
          return '👁️‍🗨️';
        default:
          return '';
      }
    },
  };
}
