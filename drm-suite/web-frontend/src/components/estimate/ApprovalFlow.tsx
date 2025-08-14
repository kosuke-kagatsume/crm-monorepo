'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ApprovalStep } from '@/types/estimate-v2'

interface ApprovalFlowProps {
  estimateId: string
  totalAmount: number
  currentStatus: 'draft' | 'pending' | 'approved' | 'rejected'
  steps?: ApprovalStep[]
  onSubmit: () => Promise<void>
  onApprove?: (comments?: string) => Promise<void>
  onReject?: (reason: string) => Promise<void>
}

interface ApprovalHistory {
  id: string
  action: 'submitted' | 'approved' | 'rejected' | 'commented'
  user: string
  role: string
  timestamp: string
  comments?: string
}

const defaultSteps: ApprovalStep[] = [
  { role: 'manager', threshold: 500000 },
  { role: 'director', threshold: 1000000 },
  { role: 'cfo', threshold: 3000000 }
]

export function ApprovalFlow({ 
  estimateId, 
  totalAmount, 
  currentStatus, 
  steps = defaultSteps,
  onSubmit,
  onApprove,
  onReject
}: ApprovalFlowProps) {
  const [history, setHistory] = useState<ApprovalHistory[]>([])
  const [comments, setComments] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [loading, setLoading] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)

  useEffect(() => {
    fetchApprovalHistory()
    determineCurrentStep()
  }, [estimateId, totalAmount])

  const fetchApprovalHistory = async () => {
    // モック履歴データ
    const mockHistory: ApprovalHistory[] = [
      {
        id: '1',
        action: 'submitted',
        user: '山田太郎',
        role: '営業担当',
        timestamp: '2024-01-20T10:00:00Z',
        comments: '外壁塗装の見積を作成しました'
      }
    ]
    
    if (currentStatus === 'pending') {
      mockHistory.push({
        id: '2',
        action: 'commented',
        user: '鈴木一郎',
        role: 'マネージャー',
        timestamp: '2024-01-20T14:00:00Z',
        comments: '原価率を確認してください'
      })
    }
    
    if (currentStatus === 'approved') {
      mockHistory.push(
        {
          id: '3',
          action: 'approved',
          user: '鈴木一郎',
          role: 'マネージャー',
          timestamp: '2024-01-20T15:00:00Z',
          comments: '原価率改善を確認しました'
        },
        {
          id: '4',
          action: 'approved',
          user: '田中部長',
          role: 'ディレクター',
          timestamp: '2024-01-21T09:00:00Z',
          comments: '承認します'
        }
      )
    }
    
    setHistory(mockHistory)
  }

  const determineCurrentStep = () => {
    // 金額に基づいて必要な承認ステップを決定
    const requiredSteps = steps.filter(step => totalAmount >= step.threshold)
    const approvedCount = history.filter(h => h.action === 'approved').length
    setCurrentStepIndex(Math.min(approvedCount, requiredSteps.length - 1))
  }

  const getRequiredApprovers = (): ApprovalStep[] => {
    return steps.filter(step => totalAmount >= step.threshold)
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      await onSubmit()
      // 履歴に追加
      setHistory([...history, {
        id: Date.now().toString(),
        action: 'submitted',
        user: '現在のユーザー',
        role: '営業担当',
        timestamp: new Date().toISOString(),
        comments
      }])
      setComments('')
    } catch (error) {
      console.error('Failed to submit for approval:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!onApprove) return
    setLoading(true)
    try {
      await onApprove(comments)
      // 履歴に追加
      setHistory([...history, {
        id: Date.now().toString(),
        action: 'approved',
        user: '現在のユーザー',
        role: getRequiredApprovers()[currentStepIndex]?.role || 'manager',
        timestamp: new Date().toISOString(),
        comments
      }])
      setComments('')
    } catch (error) {
      console.error('Failed to approve:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    if (!onReject || !rejectReason) return
    setLoading(true)
    try {
      await onReject(rejectReason)
      // 履歴に追加
      setHistory([...history, {
        id: Date.now().toString(),
        action: 'rejected',
        user: '現在のユーザー',
        role: getRequiredApprovers()[currentStepIndex]?.role || 'manager',
        timestamp: new Date().toISOString(),
        comments: rejectReason
      }])
      setRejectReason('')
      setShowRejectDialog(false)
    } catch (error) {
      console.error('Failed to reject:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'manager': return 'マネージャー'
      case 'director': return 'ディレクター'
      case 'cfo': return 'CFO'
      default: return role
    }
  }

  const getStatusBadge = () => {
    switch (currentStatus) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">承認済み</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">承認待ち</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">却下</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">下書き</Badge>
    }
  }

  const requiredApprovers = getRequiredApprovers()

  return (
    <div className="space-y-4">
      {/* ステータス概要 */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>承認ワークフロー</CardTitle>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 金額と必要承認者 */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">見積金額</span>
                <span className="text-xl font-bold">¥{totalAmount.toLocaleString()}</span>
              </div>
              <div className="text-xs text-gray-500">
                必要承認: {requiredApprovers.map(s => getRoleLabel(s.role)).join(' → ')}
              </div>
            </div>

            {/* 承認ステップ */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm">承認ステップ</h3>
              {requiredApprovers.map((step, index) => {
                const isCompleted = history.some(h => 
                  h.action === 'approved' && h.role === step.role
                )
                const isCurrent = index === currentStepIndex && currentStatus === 'pending'
                const isPending = index > currentStepIndex

                return (
                  <div 
                    key={index}
                    className={`flex items-center justify-between p-3 border rounded-lg ${
                      isCompleted ? 'bg-green-50 border-green-200' :
                      isCurrent ? 'bg-yellow-50 border-yellow-200' :
                      'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        isCompleted ? 'bg-green-500 text-white' :
                        isCurrent ? 'bg-yellow-500 text-white' :
                        'bg-gray-300 text-gray-600'
                      }`}>
                        {isCompleted ? '✓' : index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{getRoleLabel(step.role)}</p>
                        <p className="text-xs text-gray-600">
                          承認閾値: ¥{step.threshold.toLocaleString()}以上
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {isCompleted ? '承認済み' : isCurrent ? '承認待ち' : '未着手'}
                    </Badge>
                  </div>
                )
              })}
            </div>

            {/* アクションボタン */}
            {currentStatus === 'draft' && (
              <div className="space-y-3">
                <textarea
                  placeholder="コメント（任意）"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  rows={3}
                />
                <Button 
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full"
                >
                  承認申請を送信
                </Button>
              </div>
            )}

            {currentStatus === 'pending' && onApprove && onReject && (
              <div className="space-y-3">
                <textarea
                  placeholder="承認コメント（任意）"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button 
                    onClick={handleApprove}
                    disabled={loading}
                    className="flex-1"
                  >
                    承認
                  </Button>
                  <Button 
                    onClick={() => setShowRejectDialog(true)}
                    disabled={loading}
                    variant="outline"
                    className="flex-1 text-red-600 hover:bg-red-50"
                  >
                    却下
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 承認履歴 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">承認履歴</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {history.map((item) => (
              <div key={item.id} className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-1.5 ${
                  item.action === 'approved' ? 'bg-green-500' :
                  item.action === 'rejected' ? 'bg-red-500' :
                  item.action === 'submitted' ? 'bg-blue-500' :
                  'bg-gray-400'
                }`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{item.user}</span>
                    <Badge variant="outline" className="text-xs">
                      {item.role}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {new Date(item.timestamp).toLocaleString('ja-JP')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {item.action === 'approved' && '承認しました'}
                    {item.action === 'rejected' && '却下しました'}
                    {item.action === 'submitted' && '申請しました'}
                    {item.action === 'commented' && 'コメントしました'}
                  </p>
                  {item.comments && (
                    <p className="text-sm text-gray-700 mt-1 p-2 bg-gray-50 rounded">
                      {item.comments}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 却下ダイアログ */}
      {showRejectDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>却下理由の入力</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                placeholder="却下理由を入力してください（必須）"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                rows={4}
              />
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={() => setShowRejectDialog(false)}
                  variant="outline"
                  className="flex-1"
                >
                  キャンセル
                </Button>
                <Button
                  onClick={handleReject}
                  disabled={!rejectReason || loading}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  却下
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}