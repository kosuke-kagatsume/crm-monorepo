import { NextRequest, NextResponse } from 'next/server'
import { EstimateData } from '@/components/estimate/types'

let estimates: EstimateData[] = []

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const estimate = estimates.find(est => est.id === params.id)
    
    if (!estimate) {
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 })
    }
    
    if (estimate.status !== 'approved') {
      return NextResponse.json({ error: 'Can only generate PDF for approved estimates' }, { status: 400 })
    }
    
    // PDFジェネレーションのスタブ実装
    const pdfContent = generatePDFStub(estimate)
    
    return new NextResponse(pdfContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="estimate_${estimate.estimateNo}.pdf"`
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}

function generatePDFStub(estimate: EstimateData): Buffer {
  // PDFライブラリ（jsPDFやPDFKitなど）を使用してPDFを生成するスタブ
  // 今回はダミーのPDFコンテンツを返す
  const dummyPdf = Buffer.from(`
    見積書 ${estimate.estimateNo}
    
    顧客名: ${estimate.customerName}
    件名: ${estimate.title}
    
    合計金額: ¥${estimate.totalAmount.toLocaleString()}
    
    作成日: ${estimate.createdAt}
  `)
  
  return dummyPdf
}