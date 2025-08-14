import { CSVRow, AccountingMapping, JournalEntry } from '../types';

export class FreeeAdapter {
  
  /**
   * freee会計用CSV生成
   */
  generateCSV(rows: CSVRow[], mapping: AccountingMapping): string {
    const headers = [
      '取引日',
      '勘定科目（借方）',
      '金額（借方）',
      '勘定科目（貸方）',
      '金額（貸方）',
      '取引内容',
      'メモタグ（複数指定可、カンマ区切り）',
      '決算書表示名（借方）',
      '決算書表示名（貸方）',
      '品目（借方）',
      '品目（貸方）',
      '部門（借方）',
      '部門（貸方）',
      '取引先（借方）',
      '取引先（貸方）',
      'セグメント1（借方）',
      'セグメント1（貸方）',
      'セグメント2（借方）',
      'セグメント2（貸方）',
      'セグメント3（借方）',
      'セグメント3（貸方）'
    ];

    const csvRows = [headers.join(',')];

    rows.forEach(row => {
      const csvRow = [
        row.date,
        row.debitAccount || '',
        row.debitAccount ? row.amount.toString() : '',
        row.creditAccount || '',
        row.creditAccount ? row.amount.toString() : '',
        `"${row.description}"`,
        `"${row.reference}"`,
        '', // 決算書表示名（借方）
        '', // 決算書表示名（貸方）
        '', // 品目（借方）
        '', // 品目（貸方）
        row.department || '',
        row.department || '',
        '', // 取引先（借方）
        '', // 取引先（貸方）
        row.project || '', // プロジェクト
        row.project || '',
        '', // セグメント2
        '',
        '', // セグメント3
        ''
      ];
      csvRows.push(csvRow.join(','));
    });

    return csvRows.join('\n');
  }

  /**
   * freee API用の仕訳データ生成
   */
  generateAPIPayload(entry: JournalEntry): any {
    return {
      issue_date: this.formatDate(entry.entryDate),
      details: [
        {
          account_item_id: this.getAccountItemId(entry.debitAccount),
          side: 'debit',
          amount: entry.amount,
          description: entry.description,
          segment_1_tag_id: entry.projectId ? this.getProjectTagId(entry.projectId) : null,
          segment_2_tag_id: entry.department ? this.getDepartmentTagId(entry.department) : null
        },
        {
          account_item_id: this.getAccountItemId(entry.creditAccount),
          side: 'credit', 
          amount: entry.amount,
          description: entry.description,
          segment_1_tag_id: entry.projectId ? this.getProjectTagId(entry.projectId) : null,
          segment_2_tag_id: entry.department ? this.getDepartmentTagId(entry.department) : null
        }
      ],
      receipt_ids: []
    };
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private getAccountItemId(accountCode: string): number {
    // freeeの勘定科目IDマッピング（実際の値は設定から取得）
    const mapping: Record<string, number> = {
      '1110': 1, // 現金
      '1120': 2, // 普通預金
      '1130': 3, // 売掛金
      '1140': 4, // 保留金
      '2110': 5, // 買掛金
      '4110': 6, // 売上高
      '4120': 7, // 工事進行基準売上
      '5100': 8, // 売上原価
      '5110': 9, // 材料費
      '5120': 10, // 労務費
      '5130': 11, // 外注費
      '5140': 12, // その他経費
    };

    return mapping[accountCode] || 999;
  }

  private getProjectTagId(projectId: string): number {
    // プロジェクトタグIDの取得（実際はfreee APIから取得または事前登録）
    return parseInt(projectId.replace(/\D/g, '')) || 1;
  }

  private getDepartmentTagId(department: string): number {
    // 部門タグIDの取得
    const mapping: Record<string, number> = {
      'construction': 1,
      'sales': 2,
      'admin': 3,
      'aftercare': 4
    };

    return mapping[department] || 1;
  }
}