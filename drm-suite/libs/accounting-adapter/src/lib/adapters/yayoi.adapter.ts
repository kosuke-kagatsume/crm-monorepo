import { CSVRow, AccountingMapping, JournalEntry, ProjectLedgerData } from '../types';

export class YayoiAdapter {
  
  /**
   * 弥生会計用CSV生成
   */
  generateCSV(rows: CSVRow[], mapping: AccountingMapping): string {
    const headers = [
      '取引日',
      '借方勘定科目',
      '借方補助科目', 
      '借方部門',
      '借方金額',
      '貸方勘定科目',
      '貸方補助科目',
      '貸方部門', 
      '貸方金額',
      '摘要',
      '仕訳メモ',
      '税区分',
      '税額',
      '伝票No'
    ];

    const csvRows = [headers.join(',')];

    rows.forEach(row => {
      const csvRow = [
        row.date,
        row.debitAccount || '',
        row.subAccount || '',
        row.department || '',
        row.debitAccount ? row.amount.toString() : '0',
        row.creditAccount || '',
        row.subAccount || '',
        row.department || '',
        row.creditAccount ? row.amount.toString() : '0',
        `"${row.description}"`,
        `"${row.reference}"`,
        row.taxCode,
        row.taxAmount.toString(),
        row.voucherNo
      ];
      csvRows.push(csvRow.join(','));
    });

    return csvRows.join('\n');
  }

  /**
   * 工事台帳データから仕訳エントリを生成（弥生会計用）
   */
  generateJournalEntries(ledgerData: ProjectLedgerData): JournalEntry[] {
    const entries: JournalEntry[] = [];

    // 1. 契約時の仕訳
    entries.push({
      entryDate: new Date(),
      voucherNo: `CO-${ledgerData.projectId}`,
      debitAccount: '1130', // 売掛金
      creditAccount: '4110', // 売上高
      amount: ledgerData.contractAmount,
      description: `工事契約 ${ledgerData.projectId}`,
      projectId: ledgerData.projectId,
      department: 'construction'
    });

    // 2. 原価計上の仕訳
    ledgerData.costs.forEach((cost, index) => {
      const accountCode = this.getCostAccountCode(cost.docType);
      
      entries.push({
        entryDate: cost.date,
        voucherNo: `COST-${ledgerData.projectId}-${index + 1}`,
        debitAccount: accountCode,
        creditAccount: '2110', // 買掛金
        amount: cost.amount,
        description: `${cost.description} (${cost.vendorName})`,
        reference: cost.invoiceNo,
        projectId: ledgerData.projectId,
        department: cost.department
      });
    });

    // 3. 出来高計上の仕訳
    ledgerData.progress.forEach((progress, index) => {
      if (progress.billedAmt > 0) {
        entries.push({
          entryDate: progress.date,
          voucherNo: `BILL-${ledgerData.projectId}-${index + 1}`,
          debitAccount: '1130', // 売掛金
          creditAccount: '4120', // 工事進行基準売上
          amount: progress.billedAmt,
          description: `出来高請求 ${progress.progressPct}% ${progress.description}`,
          projectId: ledgerData.projectId,
          department: 'construction'
        });
      }
    });

    // 4. 変更工事の仕訳
    ledgerData.changeOrders.forEach((co, index) => {
      if (co.status === 'approved') {
        const isIncrease = co.deltaAmt > 0;
        
        entries.push({
          entryDate: co.date,
          voucherNo: `CO-${co.code}`,
          debitAccount: isIncrease ? '1130' : '4110', // 増額:売掛金, 減額:売上
          creditAccount: isIncrease ? '4110' : '1130', // 増額:売上, 減額:売掛金
          amount: Math.abs(co.deltaAmt),
          description: `変更工事 ${co.code}: ${co.description}`,
          reference: co.reason,
          projectId: ledgerData.projectId,
          department: 'construction'
        });
      }
    });

    // 5. 保留金の仕訳
    if (ledgerData.retainage.pendingRetainage > 0) {
      entries.push({
        entryDate: new Date(),
        voucherNo: `RET-${ledgerData.projectId}`,
        debitAccount: '1140', // 保留金
        creditAccount: '1130', // 売掛金
        amount: ledgerData.retainage.pendingRetainage,
        description: `保留金設定 ${ledgerData.projectId}`,
        projectId: ledgerData.projectId,
        department: 'construction'
      });
    }

    return entries;
  }

  /**
   * 原価種別に応じた勘定科目コード取得
   */
  private getCostAccountCode(docType: string): string {
    switch (docType) {
      case 'MATERIAL':
        return '5110'; // 材料費
      case 'OUTSOURCE':
        return '5130'; // 外注費
      case 'LABOR':
        return '5120'; // 労務費
      default:
        return '5140'; // その他経費
    }
  }

  /**
   * 弥生会計用の入金仕訳生成
   */
  generatePaymentEntry(
    projectId: string,
    amount: number,
    paymentDate: Date,
    paymentMethod: string
  ): JournalEntry {
    const cashAccount = paymentMethod === 'bank_transfer' ? '1120' : '1110'; // 普通預金 or 現金

    return {
      entryDate: paymentDate,
      voucherNo: `PAY-${projectId}-${paymentDate.getTime()}`,
      debitAccount: cashAccount,
      creditAccount: '1130', // 売掛金
      amount: amount,
      description: `工事代金入金 ${projectId}`,
      projectId: projectId,
      department: 'construction'
    };
  }

  /**
   * 月次まとめ仕訳の生成
   */
  generateMonthlySummary(
    year: number,
    month: number,
    projectData: ProjectLedgerData[]
  ): JournalEntry[] {
    const entries: JournalEntry[] = [];
    const summaryDate = new Date(year, month - 1, 1);

    // 月次売上集計
    const totalSales = projectData.reduce((sum, project) => 
      sum + project.progress.reduce((pSum, p) => pSum + p.billedAmt, 0), 0);

    if (totalSales > 0) {
      entries.push({
        entryDate: summaryDate,
        voucherNo: `MS-${year}${month.toString().padStart(2, '0')}`,
        debitAccount: '1130', // 売掛金
        creditAccount: '4110', // 売上高
        amount: totalSales,
        description: `${year}年${month}月 工事売上計`,
        department: 'construction'
      });
    }

    // 月次原価集計
    const totalCosts = projectData.reduce((sum, project) => 
      sum + project.costs.reduce((cSum, c) => cSum + c.amount, 0), 0);

    if (totalCosts > 0) {
      entries.push({
        entryDate: summaryDate,
        voucherNo: `MC-${year}${month.toString().padStart(2, '0')}`,
        debitAccount: '5100', // 売上原価
        creditAccount: '2110', // 買掛金
        amount: totalCosts,
        description: `${year}年${month}月 工事原価計`,
        department: 'construction'
      });
    }

    return entries;
  }
}