import { Injectable } from '@nestjs/common';

export interface MaskConfig {
  userRoles: string[];
  sensitiveFields: string[];
}

export interface MaskResult {
  data: any;
  redactionsApplied: boolean;
  redactedFields: string[];
}

@Injectable()
export class MaskPolicyService {
  private readonly defaultSensitiveFields = [
    'cost',
    'grossMargin',
    'unitPrice',
    'profitMargin',
    'costPrice',
    'purchasePrice',
    'netProfit',
  ];

  private readonly roleRestrictions: Record<string, string[]> = {
    junior: ['cost', 'grossMargin', 'unitPrice', 'profitMargin', 'costPrice'],
    sales_admin: ['cost', 'grossMargin', 'unitPrice', 'costPrice', 'purchasePrice'],
    clerk: ['grossMargin', 'profitMargin', 'netProfit'],
    customer: [
      'cost',
      'grossMargin',
      'unitPrice',
      'profitMargin',
      'costPrice',
      'purchasePrice',
      'netProfit',
    ],
  };

  /**
   * Apply mask policy to data based on user roles
   */
  applyMask(data: any, userRoles: string[]): MaskResult {
    const fieldsToRedact = this.getFieldsToRedact(userRoles);
    
    if (fieldsToRedact.length === 0) {
      return {
        data,
        redactionsApplied: false,
        redactedFields: [],
      };
    }

    const maskedData = this.deepRedact(data, fieldsToRedact);
    
    return {
      data: maskedData,
      redactionsApplied: true,
      redactedFields: fieldsToRedact,
    };
  }

  /**
   * Apply mask to text content
   */
  maskTextContent(text: string, userRoles: string[]): string {
    const fieldsToRedact = this.getFieldsToRedact(userRoles);
    
    if (fieldsToRedact.length === 0) {
      return text;
    }

    let maskedText = text;
    
    // Create patterns for each field to redact
    fieldsToRedact.forEach(field => {
      // Match field names and their values in various formats
      const patterns = [
        // JSON-like: "cost": 12345
        new RegExp(`"${field}"\\s*:\\s*[\\d.]+`, 'gi'),
        // Text: cost: 12345
        new RegExp(`${field}\\s*[:：]\\s*[\\d.,]+`, 'gi'),
        // Japanese: 原価: 12345
        new RegExp(`${this.getJapaneseFieldName(field)}\\s*[:：]\\s*[\\d.,]+`, 'gi'),
        // With currency: $12,345 or ¥12,345
        new RegExp(`${field}\\s*[:：]\\s*[¥$€£][\\d.,]+`, 'gi'),
        // Percentage: margin: 25%
        new RegExp(`${field}\\s*[:：]\\s*[\\d.]+%`, 'gi'),
      ];

      patterns.forEach(pattern => {
        maskedText = maskedText.replace(pattern, (match) => {
          const parts = match.split(/[:：]/);
          if (parts.length > 1) {
            return `${parts[0]}：[REDACTED]`;
          }
          return '[REDACTED]';
        });
      });
    });

    return maskedText;
  }

  /**
   * Get fields to redact based on user roles
   */
  private getFieldsToRedact(userRoles: string[]): string[] {
    const fieldsSet = new Set<string>();
    
    userRoles.forEach(role => {
      const restrictions = this.roleRestrictions[role.toLowerCase()];
      if (restrictions) {
        restrictions.forEach(field => fieldsSet.add(field));
      }
    });

    return Array.from(fieldsSet);
  }

  /**
   * Deep redact sensitive fields in object
   */
  private deepRedact(obj: any, fieldsToRedact: string[]): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'string') {
      return this.maskTextContent(obj, fieldsToRedact);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.deepRedact(item, fieldsToRedact));
    }

    if (typeof obj === 'object') {
      const result: any = {};
      
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const lowerKey = key.toLowerCase();
          
          // Check if this field should be redacted
          if (fieldsToRedact.some(field => lowerKey.includes(field.toLowerCase()))) {
            result[key] = '[REDACTED]';
          } else {
            result[key] = this.deepRedact(obj[key], fieldsToRedact);
          }
        }
      }
      
      return result;
    }

    return obj;
  }

  /**
   * Get Japanese field name for masking
   */
  private getJapaneseFieldName(field: string): string {
    const translations: Record<string, string> = {
      cost: '原価',
      grossMargin: '粗利',
      unitPrice: '単価',
      profitMargin: '利益率',
      costPrice: '仕入値',
      purchasePrice: '仕入価格',
      netProfit: '純利益',
    };
    
    return translations[field] || field;
  }

  /**
   * Check if user has access to sensitive data
   */
  canAccessSensitiveData(userRoles: string[]): boolean {
    const restrictedRoles = ['junior', 'sales_admin', 'clerk', 'customer'];
    return !userRoles.some(role => restrictedRoles.includes(role.toLowerCase()));
  }

  /**
   * Get policy details for audit
   */
  getPolicyDetails(userRoles: string[]): {
    roles: string[];
    restrictedFields: string[];
    canAccessAll: boolean;
  } {
    return {
      roles: userRoles,
      restrictedFields: this.getFieldsToRedact(userRoles),
      canAccessAll: this.canAccessSensitiveData(userRoles),
    };
  }
}