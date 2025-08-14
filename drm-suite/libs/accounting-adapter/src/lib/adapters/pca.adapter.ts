import { CSVRow, AccountingMapping } from '../types';

export class PCAAdapter {
  
  /**
   * PCA会計用CSV生成
   */
  generateCSV(rows: CSVRow[], mapping: AccountingMapping): string {
    const headers = [
      '仕訳日',
      '伝票No',
      '枝番',
      '借方科目',
      '借方補助',
      '借方部門',
      '借方金額',
      '貸方科目',
      '貸方補助', 
      '貸方部門',
      '貸方金額',
      '摘要',
      '消費税',
      '税込区分',
      '課税売上',
      '課税仕入',
      'プロジェクト'
    ];

    const csvRows = [headers.join(',')];

    rows.forEach((row, index) => {
      const csvRow = [
        this.formatDateForPCA(row.date),
        row.voucherNo,
        (index + 1).toString(),
        row.debitAccount || '',
        row.subAccount || '',
        row.department || '',
        row.debitAccount ? row.amount.toString() : '0',
        row.creditAccount || '',
        row.subAccount || '',
        row.department || '',
        row.creditAccount ? row.amount.toString() : '0',
        `"${row.description}"`,
        row.taxAmount.toString(),
        this.getTaxType(row.taxCode),
        this.isTaxableSales(row.debitAccount || '', row.creditAccount || '') ? row.amount.toString() : '0',
        this.isTaxablePurchase(row.debitAccount || '', row.creditAccount || '') ? row.amount.toString() : '0',
        row.project || ''
      ];
      csvRows.push(csvRow.join(','));
    });

    return csvRows.join('\n');
  }

  private formatDateForPCA(dateStr: string): string {
    // PCA会計は YYYYMMDD 形式
    return dateStr.replace(/[\/\-]/g, '');
  }

  private getTaxType(taxCode: string): string {
    const mapping: Record<string, string> = {
      '10': '1', // 課税
      '08': '2', // 軽減税率
      '00': '3'  // 非課税
    };

    return mapping[taxCode] || '1';
  }

  private isTaxableSales(debitAccount: string, creditAccount: string): boolean {
    // 売上系の勘定科目の場合は課税売上
    const salesAccounts = ['4110', '4120'];
    return salesAccounts.includes(creditAccount);
  }

  private isTaxablePurchase(debitAccount: string, creditAccount: string): boolean {
    // 原価・経費系の勘定科目の場合は課税仕入
    const expenseAccounts = ['5110', '5120', '5130', '5140'];
    return expenseAccounts.includes(debitAccount);
  }
}