'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ContractLink } from '@/types/estimate-v2'

interface ContractExportProps {
  estimateId: string
  isApproved: boolean
  existingContract?: ContractLink
  onContractCreated?: (contract: ContractLink) => void
  onStatusChange?: (status: 'draft' | 'sent' | 'signed') => void
}

interface ContractTemplate {
  id: string
  name: string
  description: string
  provider: 'gmo' | 'cloudsign'
}

interface SignerInfo {
  name: string
  email: string
  role: 'contractor' | 'customer'
}

export function ContractExport({ 
  estimateId, 
  isApproved, 
  existingContract,
  onContractCreated,
  onStatusChange
}: ContractExportProps) {
  const [selectedProvider, setSelectedProvider] = useState<'gmo' | 'cloudsign'>('cloudsign')
  const [contractStatus, setContractStatus] = useState<'draft' | 'sent' | 'signed'>(
    existingContract?.status || 'draft'
  )
  const [contractUrl, setContractUrl] = useState(existingContract?.url || '')
  const [contractId, setContractId] = useState(existingContract?.id || '')
  const [templates, setTemplates] = useState<ContractTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [signers, setSigners] = useState<SignerInfo[]>([
    { name: '', email: '', role: 'customer' },
    { name: '山田太郎', email: 'yamada@company.com', role: 'contractor' }
  ])
  const [loading, setLoading] = useState(false)
  const [showWebhookSimulator, setShowWebhookSimulator] = useState(false)
  const [draftGenerated, setDraftGenerated] = useState(false)

  useEffect(() => {
    fetchTemplates()
  }, [selectedProvider])

  const fetchTemplates = async () => {
    // プロバイダーごとのテンプレート取得
    const mockTemplates: ContractTemplate[] = [
      {
        id: 'TPL-001',
        name: '標準工事請負契約書',
        description: '一般的な建築工事用の標準契約書',
        provider: selectedProvider
      },
      {
        id: 'TPL-002',
        name: 'リフォーム工事契約書',
        description: 'リフォーム工事に特化した契約書',
        provider: selectedProvider
      },
      {
        id: 'TPL-003',
        name: '簡易請負契約書',
        description: '小規模工事向けの簡易版',
        provider: selectedProvider
      }
    ]
    
    setTemplates(mockTemplates.filter(t => t.provider === selectedProvider))
    setSelectedTemplate(mockTemplates[0]?.id || '')
  }

  const handleGenerateDraft = async () => {
    if (!isApproved) {
      alert('見積が承認されていません。承認後に契約書を作成してください。')
      return
    }

    if (!selectedTemplate) {
      alert('契約書テンプレートを選択してください')
      return
    }

    setLoading(true)
    try {
      // API呼び出し（モック）
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const newContractId = `CTR-${Date.now()}`
      const newContractUrl = selectedProvider === 'gmo'
        ? `https://gmo-sign.example.com/contracts/${newContractId}/draft`
        : `https://cloudsign.example.com/contracts/${newContractId}/draft`
      
      setContractId(newContractId)
      setContractUrl(newContractUrl)
      setDraftGenerated(true)
      
      if (onContractCreated) {
        onContractCreated({
          id: newContractId,
          provider: selectedProvider,
          status: 'draft',
          url: newContractUrl,
          createdAt: new Date().toISOString()
        })
      }
      
      alert('契約書ドラフトを生成しました')
    } catch (error) {
      console.error('Failed to generate draft:', error)
      alert('ドラフト生成に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleSendContract = async () => {
    if (!draftGenerated) {
      alert('まず契約書ドラフトを生成してください')
      return
    }

    if (!signers[0].name || !signers[0].email) {
      alert('顧客の署名者情報を入力してください')
      return
    }

    setLoading(true)
    try {
      // 契約書送信API（モック）
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const sentUrl = contractUrl.replace('/draft', '/sent')
      setContractUrl(sentUrl)
      setContractStatus('sent')
      
      if (onStatusChange) {
        onStatusChange('sent')
      }
      
      alert(`契約書を${signers[0].email}に送信しました`)
    } catch (error) {
      console.error('Failed to send contract:', error)
      alert('契約書送信に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleSimulateWebhook = () => {
    // Webhook受信をシミュレート（実際はWebhook受信で自動更新）
    if (contractStatus !== 'sent') {
      alert('契約書が送信済みである必要があります')
      return
    }

    setContractStatus('signed')
    const signedUrl = contractUrl.replace('/sent', '/signed')
    setContractUrl(signedUrl)
    
    if (onStatusChange) {
      onStatusChange('signed')
    }
    
    alert('契約書が署名されました（シミュレーション）')
  }

  const getStatusBadge = () => {
    switch (contractStatus) {
      case 'signed':
        return <Badge className="bg-green-100 text-green-800">締結済み</Badge>
      case 'sent':
        return <Badge className="bg-blue-100 text-blue-800">送信済み</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">下書き</Badge>
    }
  }

  const getProviderLogo = (provider: 'gmo' | 'cloudsign') => {
    return provider === 'gmo' ? '🔒 GMO Sign' : '☁️ CloudSign'
  }

  return (
    <div className="space-y-4">
      {/* プロバイダー選択 */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>電子契約プロバイダー</CardTitle>
            {existingContract && getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <button
              onClick={() => setSelectedProvider('gmo')}
              disabled={!!existingContract}
              className={`p-4 border-2 rounded-lg transition-all ${
                selectedProvider === 'gmo'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              } ${existingContract ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="text-center">
                <div className="text-2xl mb-2">🔒</div>
                <p className="font-medium">GMO Sign</p>
                <p className="text-xs text-gray-600 mt-1">
                  国内シェアNo.1の電子契約
                </p>
              </div>
            </button>
            
            <button
              onClick={() => setSelectedProvider('cloudsign')}
              disabled={!!existingContract}
              className={`p-4 border-2 rounded-lg transition-all ${
                selectedProvider === 'cloudsign'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              } ${existingContract ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="text-center">
                <div className="text-2xl mb-2">☁️</div>
                <p className="font-medium">CloudSign</p>
                <p className="text-xs text-gray-600 mt-1">
                  弁護士監修の電子契約
                </p>
              </div>
            </button>
          </div>

          {!existingContract && (
            <>
              {/* テンプレート選択 */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">契約書テンプレート</label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {templates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name} - {template.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* 署名者情報 */}
              <div className="space-y-3">
                <label className="block text-sm font-medium">署名者情報</label>
                {signers.map((signer, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="text-xs">
                        {signer.role === 'customer' ? '発注者' : '受注者'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="署名者名"
                        value={signer.name}
                        onChange={(e) => {
                          const newSigners = [...signers]
                          newSigners[index].name = e.target.value
                          setSigners(newSigners)
                        }}
                        disabled={signer.role === 'contractor'}
                      />
                      <Input
                        type="email"
                        placeholder="メールアドレス"
                        value={signer.email}
                        onChange={(e) => {
                          const newSigners = [...signers]
                          newSigners[index].email = e.target.value
                          setSigners(newSigners)
                        }}
                        disabled={signer.role === 'contractor'}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 契約書生成・送信 */}
      <Card>
        <CardHeader>
          <CardTitle>契約書操作</CardTitle>
        </CardHeader>
        <CardContent>
          {!existingContract ? (
            <div className="space-y-4">
              {!draftGenerated ? (
                <Button
                  onClick={handleGenerateDraft}
                  disabled={!isApproved || loading}
                  className="w-full"
                >
                  {loading ? '生成中...' : '契約書ドラフトを生成'}
                </Button>
              ) : (
                <>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium mb-1">生成された契約書</p>
                    <p className="text-xs text-gray-600">{contractId}</p>
                    <a
                      href={contractUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      {contractUrl}
                    </a>
                  </div>
                  
                  <Button
                    onClick={handleSendContract}
                    disabled={loading || contractStatus !== 'draft'}
                    className="w-full"
                  >
                    {loading ? '送信中...' : '顧客に契約書を送信'}
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* 既存契約書の表示 */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-medium">{getProviderLogo(existingContract.provider)}</p>
                    <p className="text-sm text-gray-600 mt-1">契約書ID: {existingContract.id}</p>
                  </div>
                  {getStatusBadge()}
                </div>
                
                {existingContract.url && (
                  <a
                    href={existingContract.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50"
                  >
                    <span>📄</span>
                    <span className="text-sm">契約書を表示</span>
                  </a>
                )}
              </div>

              {/* ステータス更新（Webhookシミュレーション） */}
              {contractStatus === 'sent' && (
                <div className="p-4 border-2 border-dashed rounded-lg">
                  <p className="text-sm text-gray-600 mb-3">
                    署名完了Webhookは後続実装のため、ここではステータストグルで代替
                  </p>
                  <Button
                    onClick={() => setShowWebhookSimulator(true)}
                    variant="outline"
                    className="w-full"
                  >
                    Webhook受信をシミュレート
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* 契約履歴 */}
          {existingContract && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-medium text-sm mb-3">契約履歴</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-gray-600">
                    {new Date(existingContract.createdAt).toLocaleString('ja-JP')}
                  </span>
                  <span>契約書ドラフト生成</span>
                </div>
                {(contractStatus === 'sent' || contractStatus === 'signed') && (
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="text-gray-600">
                      {new Date().toLocaleString('ja-JP')}
                    </span>
                    <span>契約書送信</span>
                  </div>
                )}
                {contractStatus === 'signed' && (
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-gray-600">
                      {new Date().toLocaleString('ja-JP')}
                    </span>
                    <span>契約締結完了</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Webhookシミュレーターダイアログ */}
      {showWebhookSimulator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Webhook受信シミュレーター</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <p className="text-sm font-medium text-yellow-800 mb-2">
                    ⚠️ 開発用機能
                  </p>
                  <p className="text-xs text-yellow-700">
                    本番環境では、{selectedProvider === 'gmo' ? 'GMO Sign' : 'CloudSign'}からの
                    Webhookを受信して自動的にステータスが更新されます。
                  </p>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium mb-2">シミュレート内容</p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• 契約書ステータス: sent → signed</li>
                    <li>• 署名者: {signers[0].name || '顧客'}</li>
                    <li>• 署名日時: {new Date().toLocaleString('ja-JP')}</li>
                  </ul>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowWebhookSimulator(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    キャンセル
                  </Button>
                  <Button
                    onClick={() => {
                      handleSimulateWebhook()
                      setShowWebhookSimulator(false)
                    }}
                    className="flex-1"
                  >
                    署名完了を受信
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}