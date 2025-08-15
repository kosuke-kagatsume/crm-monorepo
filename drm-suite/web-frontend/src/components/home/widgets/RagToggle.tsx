'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Sparkles } from 'lucide-react';

interface RagToggleProps {
  onClick?: () => void;
  isOpen?: boolean;
}

export function RagToggle({ onClick, isOpen = false }: RagToggleProps) {
  return (
    <Card
      className="h-full cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-blue-600" />
          RAGアシスタント
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
          <MessageSquare className="h-12 w-12 text-blue-600 mb-2" />
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-3">質問や資料検索はこちら</p>
          <Button className="w-full" variant={isOpen ? 'default' : 'secondary'}>
            {isOpen ? 'RAGを閉じる' : 'RAGを開く'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
