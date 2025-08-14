import { CSVRow, AccountingMapping } from '../types';

export class MFAdapter {
  
  /**
   * マネーフォワード会計用CSV生成
   */
  generateCSV(rows: CSVRow[], mapping: AccountingMapping): string {
    const headers = [
      '取引日',
      '仕訳帳No.',
      '取引先',
      '勘定科目（借方）',
      '金額（借方）',
      '税区分（借方）',
      '勘定科目（貸方）',
      '金額（貸方）',
      '税区分（貸方）',
      '摘要',
      'メモ',
      'タグ',
      'セグメント1',
      'セグメント2'
    ];

    const csvRows = [headers.join(',')];

    rows.forEach(row => {
      const csvRow = [
        row.date,
        row.voucherNo,
        '', // 取引先
        row.debitAccount || '',
        row.debitAccount ? row.amount.toString() : '',
        row.debitAccount ? this.convertTaxCode(row.taxCode) : '',
        row.creditAccount || '',
        row.creditAccount ? row.amount.toString() : '',
        row.creditAccount ? this.convertTaxCode(row.taxCode) : '',
        `"${row.description}"`,
        `"${row.reference}"`,
        row.project || '',
        row.department || '',
        '' // セグメント2
      ];
      csvRows.push(csvRow.join(','));
    });

    return csvRows.join('\n');
  }

  private convertTaxCode(taxCode: string): string {
    // マネーフォワードの税区分コード
    const mapping: Record<string, string> = {
      '10': '課税売上 10%',
      '08': '軽減税率 8%',
      '00': '対象外'
    };

    return mapping[taxCode] || '課税売上 10%';
  }

  /**
   * マネーフォワード API用のペイロード生成
   */
  generateAPIPayload(entries: CSVRow[]): any {
    return {
      journal_entries: entries.map(entry => ({
        txn_date: entry.date,
        description: entry.description,
        line_items: [
          {
            account_code: entry.debitAccount,
            amount: entry.amount,
            side: 'debit',
            description: entry.description,
            tag_names: entry.project ? [entry.project] : [],
            segment: entry.department || ''
          },
          {
            account_code: entry.creditAccount,
            amount: entry.amount,
            side: 'credit',
            description: entry.description,
            tag_names: entry.project ? [entry.project] : [],
            segment: entry.department || ''
          }
        ]
      }))
    };
  }
}