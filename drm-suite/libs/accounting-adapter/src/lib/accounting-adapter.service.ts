import { Injectable } from '@nestjs/common';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { 
  AccountingMapping, 
  LedgerData, 
  AccountingSystem,
  CSVRow 
} from './types';
import { YayoiAdapter } from './adapters/yayoi.adapter';
import { BugyoAdapter } from './adapters/bugyo.adapter';
import { PCAAdapter } from './adapters/pca.adapter';
import { FreeeAdapter } from './adapters/freee.adapter';
import { MFAdapter } from './adapters/mf.adapter';

@Injectable()
export class AccountingAdapterService {
  private adapters: Map<AccountingSystem, any>;
  private mappingsPath = join(process.cwd(), 'config', 'accounting-mappings');

  constructor() {
    this.adapters = new Map([
      [AccountingSystem.YAYOI, new YayoiAdapter()],
      [AccountingSystem.BUGYO, new BugyoAdapter()],
      [AccountingSystem.PCA, new PCAAdapter()],
      [AccountingSystem.FREEE, new FreeeAdapter()],
      [AccountingSystem.MF, new MFAdapter()],
    ]);
  }

  async getCompanyMapping(companyId: string): Promise<AccountingMapping> {
    const mappingFile = join(this.mappingsPath, `${companyId}.json`);
    
    if (existsSync(mappingFile)) {
      const content = readFileSync(mappingFile, 'utf-8');
      return JSON.parse(content);
    }

    // Return default mapping if company-specific doesn't exist
    return this.getDefaultMapping();
  }

  async updateCompanyMapping(
    companyId: string,
    system: string,
    mapping: AccountingMapping,
  ): Promise<void> {
    const mappingFile = join(this.mappingsPath, `${companyId}.json`);
    
    const existingMapping = await this.getCompanyMapping(companyId);
    existingMapping.system = system as AccountingSystem;
    existingMapping.accounts = { ...existingMapping.accounts, ...mapping.accounts };
    existingMapping.departments = { ...existingMapping.departments, ...mapping.departments };
    existingMapping.taxCodes = { ...existingMapping.taxCodes, ...mapping.taxCodes };
    
    writeFileSync(mappingFile, JSON.stringify(existingMapping, null, 2));
  }

  async generateCSV(
    ledgerData: LedgerData[],
    mapping: AccountingMapping,
    format: string = 'csv',
  ): Promise<string> {
    const adapter = this.adapters.get(mapping.system);
    
    if (!adapter) {
      throw new Error(`Unsupported accounting system: ${mapping.system}`);
    }

    // Convert ledger data to CSV rows with mapping applied
    const rows: CSVRow[] = ledgerData.map(entry => this.mapLedgerToCSV(entry, mapping));
    
    // Generate CSV based on accounting system format
    return adapter.generateCSV(rows, mapping);
  }

  private mapLedgerToCSV(entry: LedgerData, mapping: AccountingMapping): CSVRow {
    const accountCode = this.mapAccount(entry.accountType, mapping);
    const taxCode = this.mapTaxCode(entry.taxRate, mapping);
    const departmentCode = this.mapDepartment(entry.department, mapping);

    return {
      date: this.formatDate(entry.date),
      voucherNo: entry.voucherNo || '',
      debitAccount: entry.isDebit ? accountCode : '',
      creditAccount: !entry.isDebit ? accountCode : '',
      amount: entry.amount,
      taxCode: taxCode,
      taxAmount: entry.taxAmount || 0,
      description: entry.description,
      subAccount: entry.subAccount || '',
      department: departmentCode,
      project: entry.projectCode || '',
      reference: entry.reference || '',
    };
  }

  private mapAccount(accountType: string, mapping: AccountingMapping): string {
    // Map internal account types to accounting system codes
    const accountMap = mapping.accounts || {};
    
    const defaultMap: Record<string, string> = {
      'sales': '4110',
      'material_cost': '5110',
      'labor_cost': '5120',
      'outsource_cost': '5130',
      'overhead': '5140',
      'accounts_receivable': '1130',
      'accounts_payable': '2110',
      'cash': '1110',
      'retainage': '1140',
    };

    return accountMap[accountType] || defaultMap[accountType] || '9999';
  }

  private mapTaxCode(taxRate: number, mapping: AccountingMapping): string {
    const taxMap = mapping.taxCodes || {};
    
    if (taxRate === 0.1) return taxMap['10'] || '10';
    if (taxRate === 0.08) return taxMap['8'] || '08';
    if (taxRate === 0) return taxMap['0'] || '00';
    
    return '10'; // Default to 10%
  }

  private mapDepartment(department: string | undefined, mapping: AccountingMapping): string {
    if (!department) return '';
    
    const deptMap = mapping.departments || {};
    return deptMap[department] || department;
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  }

  private getDefaultMapping(): AccountingMapping {
    return {
      system: AccountingSystem.YAYOI,
      accounts: {
        'sales': '4110',
        'material_cost': '5110',
        'labor_cost': '5120',
        'outsource_cost': '5130',
        'overhead': '5140',
        'accounts_receivable': '1130',
        'accounts_payable': '2110',
        'cash': '1110',
        'retainage': '1140',
      },
      subAccounts: {},
      departments: {
        'construction': '100',
        'sales': '200',
        'admin': '300',
        'aftercare': '400',
      },
      taxCodes: {
        '10': '10',
        '8': '08',
        '0': '00',
      },
    };
  }
}