import { CSVRow, AccountingMapping } from '../types';

export class BugyoAdapter {
  
  /**
   * 勘定奉行用CSV生成
   */
  generateCSV(rows: CSVRow[], mapping: AccountingMapping): string {
    const headers = [
      '伝票日付',
      '伝票番号',
      '行番号',
      '借方科目コード',
      '借方科目名',
      '借方補助コード',
      '借方補助名',
      '借方部門コード',
      '借方部門名',
      '借方金額',
      '貸方科目コード',
      '貸方科目名',
      '貸方補助コード',
      '貸方補助名',
      '貸方部門コード',
      '貸方部門名',
      '貸方金額',
      '摘要',
      '税区分',
      '税率',
      '税額'
    ];

    const csvRows = [headers.join(',')];

    rows.forEach((row, index) => {
      const csvRow = [
        row.date,
        row.voucherNo,
        (index + 1).toString(),
        row.debitAccount || '',
        this.getAccountName(row.debitAccount || ''),
        row.subAccount || '',
        row.subAccount || '',
        row.department || '',
        this.getDepartmentName(row.department || ''),
        row.debitAccount ? row.amount.toString() : '0',
        row.creditAccount || '',
        this.getAccountName(row.creditAccount || ''),
        row.subAccount || '',
        row.subAccount || '',
        row.department || '',
        this.getDepartmentName(row.department || ''),
        row.creditAccount ? row.amount.toString() : '0',
        `"${row.description}"`,
        row.taxCode,
        this.getTaxRate(row.taxCode),
        row.taxAmount.toString()
      ];
      csvRows.push(csvRow.join(','));
    });

    return csvRows.join('\n');
  }

  private getAccountName(accountCode: string): string {
    const mapping: Record<string, string> = {
      '1110': '現金',
      '1120': '普通預金',
      '1130': '売掛金',
      '1140': '保留金',
      '2110': '買掛金',
      '4110': '売上高',
      '4120': '工事進行基準売上',
      '5100': '売上原価',
      '5110': '材料費',
      '5120': '労務費',
      '5130': '外注費',
      '5140': 'その他経費'
    };

    return mapping[accountCode] || '';
  }

  private getDepartmentName(deptCode: string): string {
    const mapping: Record<string, string> = {
      '100': '工事部',
      '200': '営業部',
      '300': '管理部',
      '400': 'アフター部'
    };

    return mapping[deptCode] || '';
  }

  private getTaxRate(taxCode: string): string {
    const mapping: Record<string, string> = {
      '10': '10.0',
      '08': '8.0',
      '00': '0.0'
    };

    return mapping[taxCode] || '10.0';
  }
}