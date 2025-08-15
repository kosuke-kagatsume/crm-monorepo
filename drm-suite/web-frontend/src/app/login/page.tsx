'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface QuickLoginAccount {
  name: string;
  role: string;
  email: string;
  password: string;
  status: 'manager' | 'supervisor' | 'worker';
  department: string;
  permissions: string[];
  avatar: string;
  gradient: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [selectedAccount, setSelectedAccount] =
    useState<QuickLoginAccount | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const quickAccounts: QuickLoginAccount[] = [
    {
      name: '山田 太郎',
      role: '経営者',
      email: 'yamada@drm.com',
      password: 'admin123',
      status: 'manager',
      department: '経営管理',
      permissions: ['スケジュール管理', '売上分析', '現場管理', '承認権限'],
      avatar: '👨‍💼',
      gradient: 'linear-gradient(135deg, #0099CC 0%, #66CCFF 100%)',
    },
    {
      name: '鈴木 一郎',
      role: '支店長',
      email: 'suzuki@drm.com',
      password: 'admin123',
      status: 'supervisor',
      department: '東京支店',
      permissions: [
        '自分のスケジュール確認',
        '作業報告書作成',
        '予定変更申請',
        'チャット機能',
      ],
      avatar: '👷',
      gradient: 'linear-gradient(135deg, #FF9933 0%, #FFCC33 100%)',
    },
    {
      name: '佐藤 次郎',
      role: '営業担当',
      email: 'sato@drm.com',
      password: 'admin123',
      status: 'worker',
      department: '営業部',
      permissions: ['自分のスケジュール確認', '作業進捗登録', 'チャット機能'],
      avatar: '👨‍💻',
      gradient: 'linear-gradient(135deg, #FF3366 0%, #FF9933 100%)',
    },
    {
      name: '山田 愛子',
      role: '経理担当',
      email: 'aiko@drm.com',
      password: 'admin123',
      status: 'worker',
      department: '経理部',
      permissions: ['請求書作成', '入金管理', '財務分析', '月次報告'],
      avatar: '👩‍💼',
      gradient: 'linear-gradient(135deg, #9333EA 0%, #FF3366 100%)',
    },
    {
      name: '木村 健太',
      role: 'マーケティング',
      email: 'kimura@drm.com',
      password: 'admin123',
      status: 'worker',
      department: 'マーケティング部',
      permissions: ['キャンペーン管理', 'Web分析', 'SEO対策', 'SNS運用'],
      avatar: '📊',
      gradient: 'linear-gradient(135deg, #FFCC33 0%, #10B981 100%)',
    },
    {
      name: '田中 三郎',
      role: '施工管理',
      email: 'tanaka@drm.com',
      password: 'admin123',
      status: 'supervisor',
      department: '施工部',
      permissions: ['現場管理', '作業指示', '品質管理', '安全管理', '進捗報告'],
      avatar: '👷‍♂️',
      gradient: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
    },
    {
      name: '高橋 花子',
      role: '事務員',
      email: 'takahashi@drm.com',
      password: 'admin123',
      status: 'worker',
      department: '事務部',
      permissions: ['資料作成', '電話対応', 'スケジュール管理', 'ファイル管理'],
      avatar: '👩‍💻',
      gradient: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
    },
    {
      name: '中村 次郎',
      role: 'アフター担当',
      email: 'nakamura@drm.com',
      password: 'admin123',
      status: 'worker',
      department: 'アフターサービス部',
      permissions: [
        'アフター対応',
        '顧客フォロー',
        '修理依頼管理',
        'クレーム対応',
      ],
      avatar: '🔧',
      gradient: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)',
    },
  ];

  const handleQuickLogin = (account: QuickLoginAccount) => {
    setSelectedAccount(account);
    // セッション保存
    if (typeof window !== 'undefined') {
      localStorage.setItem('userRole', account.role);
      localStorage.setItem('userEmail', account.email);
      localStorage.setItem('userName', account.name);
      // ホームへ遷移（useRouterを使用）
      setTimeout(() => {
        router.push('/home');
      }, 500);
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <>
      <div
        className="min-h-screen"
        style={{
          background: 'linear-gradient(135deg, #0099CC15 0%, #66CCFF15 100%)',
        }}
      >
        <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12">
          {/* ヘッダー */}
          <div className="text-center mb-12 fade-in-animation">
            <div
              className="inline-flex items-center justify-center w-20 h-20 rounded-full shadow-xl mb-4"
              style={{
                background: 'linear-gradient(135deg, #0099CC 0%, #00CCFF 100%)',
              }}
            >
              <span className="text-4xl text-white">🏗️</span>
            </div>
            <h1
              className="text-4xl font-bold mb-2"
              style={{
                background: 'linear-gradient(135deg, #0099CC 0%, #00CCFF 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              DRM Suite v1.1
            </h1>
            <p className="text-gray-600">Dandori Relation Management System</p>
          </div>

          {/* デモ用クイックログイン */}
          <div className="w-full max-w-5xl">
            <h3 className="text-center text-lg font-semibold text-gray-700 mb-6">
              🚀 デモ用クイックログイン
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickAccounts.map((account) => (
                <button
                  key={account.email}
                  onClick={() => handleQuickLogin(account)}
                  className="relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                  style={{
                    border:
                      selectedAccount?.email === account.email
                        ? '2px solid #0099CC'
                        : '2px solid transparent',
                    boxShadow:
                      selectedAccount?.email === account.email
                        ? '0 0 0 4px rgba(0, 153, 204, 0.2), 0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                        : '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  {/* グラデーションバッジ */}
                  <div
                    className="absolute -top-3 -right-3 w-16 h-16 rounded-full flex items-center justify-center shadow-lg"
                    style={{ background: account.gradient }}
                  >
                    <span className="text-2xl">{account.avatar}</span>
                  </div>

                  <div className="text-left">
                    <h4 className="font-bold text-lg text-gray-800 mb-1">
                      {account.name}
                    </h4>
                    <p
                      className="text-sm font-medium mb-2"
                      style={{ color: '#0099CC' }}
                    >
                      {account.role}
                    </p>
                    <p className="text-xs text-gray-500 mb-3">
                      {account.department}
                    </p>

                    <div className="space-y-1">
                      <p className="text-xs text-gray-600">権限:</p>
                      <div className="flex flex-wrap gap-1">
                        {account.permissions.slice(0, 3).map((perm, idx) => (
                          <span
                            key={idx}
                            className="inline-block px-2 py-0.5 text-xs rounded-full"
                            style={{
                              backgroundColor: 'rgba(0, 153, 204, 0.1)',
                              color: '#0099CC',
                            }}
                          >
                            {perm}
                          </span>
                        ))}
                        {account.permissions.length > 3 && (
                          <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                            +{account.permissions.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {selectedAccount?.email === account.email && (
                    <div
                      className="absolute inset-0 flex items-center justify-center rounded-2xl fade-in-animation"
                      style={{
                        backgroundColor: 'rgba(0, 153, 204, 0.9)',
                      }}
                    >
                      <div className="text-white text-center">
                        <div
                          className="inline-block rounded-full h-8 w-8 border-4 mb-2 spin-animation"
                          style={{
                            borderColor: 'rgba(255, 255, 255, 0.3)',
                            borderTopColor: 'white',
                          }}
                        ></div>
                        <p className="text-sm font-medium">ログイン中...</p>
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* フッター */}
          <div className="mt-12 text-center">
            <p className="text-sm text-gray-500">
              © 2024 DRM Suite - Powered by Dandori Work
            </p>
            <div className="mt-2 flex justify-center gap-4">
              <a
                href="#"
                className="text-xs transition-colors hover:opacity-70"
                style={{ color: '#0099CC' }}
              >
                利用規約
              </a>
              <span className="text-gray-300">|</span>
              <a
                href="#"
                className="text-xs transition-colors hover:opacity-70"
                style={{ color: '#0099CC' }}
              >
                プライバシーポリシー
              </a>
              <span className="text-gray-300">|</span>
              <a
                href="#"
                className="text-xs transition-colors hover:opacity-70"
                style={{ color: '#0099CC' }}
              >
                ヘルプ
              </a>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .fade-in-animation {
          animation: fadeIn 0.5s ease-out;
        }

        .spin-animation {
          animation: spin 1s linear infinite;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  );
}
