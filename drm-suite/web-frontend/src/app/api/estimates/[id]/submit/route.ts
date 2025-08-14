import { NextRequest, NextResponse } from 'next/server'
import { EstimateData } from '@/components/estimate/types'

let estimates: EstimateData[] = []

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const estimateIndex = estimates.findIndex(est => est.id === params.id)
    
    if (estimateIndex === -1) {
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 })
    }
    
    const estimate = estimates[estimateIndex]
    
    if (estimate.status !== 'draft') {
      return NextResponse.json({ error: 'Can only submit draft estimates' }, { status: 400 })
    }
    
    estimates[estimateIndex] = {
      ...estimate,
      status: 'submitted',
      updatedAt: new Date().toISOString()
    }
    
    return NextResponse.json({ estimate: estimates[estimateIndex] })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to submit estimate for approval' }, { status: 500 })
  }
}