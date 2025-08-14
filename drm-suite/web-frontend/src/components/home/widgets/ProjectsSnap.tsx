'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFeatureFlag } from '@/config/featureFlags';
import Link from 'next/link';

interface Project {
  id: string;
  name: string;
  status: 'planning' | 'active' | 'completed' | 'pending';
  customer: string;
  estimateStatus?: 'draft' | 'approved' | 'none';
  progress: number;
  amount?: number;
  startDate?: string;
  endDate?: string;
}

export function ProjectsSnap() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const newEstimateEnabled = useFeatureFlag('new_estimate', searchParams);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    // モックデータ（実際はAPIから取得）
    const mockProjects: Project[] = [
      {
        id: 'PRJ-001',
        name: '山田様邸 外壁塗装工事',
        status: 'active',
        customer: '山田太郎',
        estimateStatus: 'approved',
        progress: 45,
        amount: 1350000,
        startDate: '2024-01-15',
        endDate: '2024-02-28',
      },
      {
        id: 'PRJ-002',
        name: '鈴木様邸 屋根修理',
        status: 'planning',
        customer: '鈴木一郎',
        estimateStatus: 'draft',
        progress: 0,
        amount: 850000,
        startDate: '2024-02-01',
      },
      {
        id: 'PRJ-003',
        name: '田中様邸 キッチンリフォーム',
        status: 'pending',
        customer: '田中花子',
        estimateStatus: 'none',
        progress: 0,
        amount: 2200000,
        startDate: '2024-02-15',
      },
      {
        id: 'PRJ-004',
        name: '佐藤様邸 浴室改修',
        status: 'completed',
        customer: '佐藤次郎',
        estimateStatus: 'approved',
        progress: 100,
        amount: 980000,
        startDate: '2023-12-01',
        endDate: '2024-01-10',
      },
    ];

    setProjects(mockProjects);
    setLoading(false);
  };

  const getStatusBadge = (status: Project['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">進行中</Badge>;
      case 'planning':
        return <Badge className="bg-blue-100 text-blue-800">計画中</Badge>;
      case 'completed':
        return <Badge className="bg-gray-100 text-gray-800">完了</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">保留</Badge>;
      default:
        return null;
    }
  };

  const getEstimateStatusBadge = (status?: Project['estimateStatus']) => {
    switch (status) {
      case 'approved':
        return (
          <Badge variant="outline" className="text-xs">
            見積承認済
          </Badge>
        );
      case 'draft':
        return (
          <Badge variant="outline" className="text-xs">
            見積作成中
          </Badge>
        );
      case 'none':
      default:
        return (
          <Badge variant="outline" className="text-xs">
            見積未作成
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-base">進行中の案件</CardTitle>
          <Link href="/projects">
            <Button variant="ghost" size="sm">
              すべて見る →
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {projects.slice(0, 4).map((project) => (
            <div
              key={project.id}
              className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm">{project.name}</h4>
                    {getStatusBadge(project.status)}
                  </div>
                  <p className="text-xs text-gray-600">
                    顧客: {project.customer}
                  </p>
                  {project.amount && (
                    <p className="text-xs text-gray-600">
                      予算: ¥{project.amount.toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  {getEstimateStatusBadge(project.estimateStatus)}
                </div>
              </div>

              {/* 進捗バー */}
              {project.status === 'active' && (
                <div className="mb-2">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>進捗</span>
                    <span>{project.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* アクションボタン */}
              <div className="flex gap-2 mt-2">
                {/* 見積ボタン - projectIdパラメータ付きでリンク（フラグ制御） */}
                {project.estimateStatus === 'none' ? (
                  newEstimateEnabled ? (
                    <Link
                      href={`/estimate/new?projectId=${project.id}&customer=${encodeURIComponent(project.customer)}&title=${encodeURIComponent(project.name)}`}
                    >
                      <Button size="sm" variant="outline" className="text-xs">
                        見積作成
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      disabled
                    >
                      見積作成（準備中）
                    </Button>
                  )
                ) : project.estimateStatus === 'draft' ? (
                  <Link href={`/estimate?projectId=${project.id}`}>
                    <Button size="sm" variant="outline" className="text-xs">
                      見積編集
                    </Button>
                  </Link>
                ) : (
                  <Link href={`/estimate?projectId=${project.id}`}>
                    <Button size="sm" variant="outline" className="text-xs">
                      見積確認
                    </Button>
                  </Link>
                )}

                {/* 詳細ボタン - /projectsへのリンク */}
                <Link href={`/projects/${project.id}`}>
                  <Button size="sm" variant="ghost" className="text-xs">
                    案件詳細
                  </Button>
                </Link>
              </div>
            </div>
          ))}

          {projects.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">進行中の案件はありません</p>
              {newEstimateEnabled ? (
                <Link href="/estimate/new">
                  <Button className="mt-3" size="sm">
                    新規見積を作成
                  </Button>
                </Link>
              ) : (
                <Button className="mt-3" size="sm" disabled>
                  新規見積を作成（準備中）
                </Button>
              )}
            </div>
          )}
        </div>

        {/* クイックアクション */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-600">
              アクティブ案件:{' '}
              {projects.filter((p) => p.status === 'active').length}件
            </span>
            {newEstimateEnabled ? (
              <Link href="/estimate/new">
                <Button size="sm" className="text-xs">
                  + 新規見積
                </Button>
              </Link>
            ) : (
              <Button size="sm" className="text-xs" disabled>
                + 新規見積（準備中）
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
