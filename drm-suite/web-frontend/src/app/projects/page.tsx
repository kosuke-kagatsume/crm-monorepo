/* 🔒 DO NOT EDIT: /projects は改変禁止。新機能は別ページで実装（リンクのみ許可） */
/* # DO-NOT-TOUCH - このファイルは絶対に変更しないこと。Sprint 0 保護済み */
'use client';

import { useState, useEffect } from 'react';

interface Project {
  id: string;
  name: string;
  client: string;
  status: 'planning' | 'in-progress' | 'completed' | 'on-hold';
  startDate: string;
  endDate: string;
  budget: number;
  progress: number;
  manager: string;
}

// ダミーデータ
const mockProjects: Project[] = [
  {
    id: 'PRJ-001',
    name: '山田様邸 新築工事',
    client: '山田太郎',
    status: 'in-progress',
    startDate: '2024-01-15',
    endDate: '2024-06-30',
    budget: 25000000,
    progress: 65,
    manager: '田中三郎',
  },
  {
    id: 'PRJ-002',
    name: '鈴木オフィス改装',
    client: '株式会社鈴木商事',
    status: 'planning',
    startDate: '2024-03-01',
    endDate: '2024-04-15',
    budget: 8500000,
    progress: 10,
    manager: '佐藤次郎',
  },
  {
    id: 'PRJ-003',
    name: '高橋マンション修繕',
    client: '高橋花子',
    status: 'completed',
    startDate: '2023-11-01',
    endDate: '2024-01-31',
    budget: 3200000,
    progress: 100,
    manager: '中村次郎',
  },
  {
    id: 'PRJ-004',
    name: '木村店舗リノベーション',
    client: '木村健太',
    status: 'on-hold',
    startDate: '2024-02-15',
    endDate: '2024-05-30',
    budget: 12000000,
    progress: 25,
    manager: '田中三郎',
  },
];

const statusLabels = {
  planning: '計画中',
  'in-progress': '施工中',
  completed: '完了',
  'on-hold': '中断',
};

const statusColors = {
  planning: 'bg-blue-100 text-blue-800',
  'in-progress': 'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-800',
  'on-hold': 'bg-yellow-100 text-yellow-800',
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 実際のAPIからデータを取得する代わりにダミーデータを使用
    setTimeout(() => {
      setProjects(mockProjects);
      setLoading(false);
    }, 500);
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto max-w-7xl py-6">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">
              プロジェクト情報を読み込み中...
            </p>
          </div>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP');
  };

  return (
    <div className="container mx-auto max-w-7xl py-6 space-y-6">
      {/* ヘッダー */}
      <header className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              プロジェクト管理
            </h1>
            <p className="text-gray-600 mt-1">
              現在進行中のプロジェクトと完了済みプロジェクトの管理
            </p>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              新規プロジェクト
            </button>
            <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
              エクスポート
            </button>
          </div>
        </div>
      </header>

      {/* プロジェクト統計 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <div className="w-6 h-6 text-blue-600">📋</div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                総プロジェクト
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {projects.length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <div className="w-6 h-6 text-green-600">🚀</div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">進行中</p>
              <p className="text-2xl font-bold text-gray-900">
                {projects.filter((p) => p.status === 'in-progress').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <div className="w-6 h-6 text-gray-600">✅</div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">完了</p>
              <p className="text-2xl font-bold text-gray-900">
                {projects.filter((p) => p.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <div className="w-6 h-6 text-yellow-600">⏸️</div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">中断</p>
              <p className="text-2xl font-bold text-gray-900">
                {projects.filter((p) => p.status === 'on-hold').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* プロジェクト一覧テーブル */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            プロジェクト一覧
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table
            className="project-list w-full min-w-[900px]"
            data-testid="projects-table"
          >
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                  プロジェクト
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                  顧客
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  状態
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  期間
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  予算
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  進捗
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  担当者
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {projects.map((project) => (
                <tr key={project.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {project.name}
                      </div>
                      <div className="text-sm text-gray-500">{project.id}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {project.client}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        statusColors[project.status]
                      }`}
                    >
                      {statusLabels[project.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>開始: {formatDate(project.startDate)}</div>
                    <div>完了: {formatDate(project.endDate)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(project.budget)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${project.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-900">
                        {project.progress}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {project.manager}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        詳細
                      </button>
                      <button className="text-gray-600 hover:text-gray-900">
                        編集
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
