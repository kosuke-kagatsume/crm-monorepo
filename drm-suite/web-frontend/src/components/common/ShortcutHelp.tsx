'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFeatureFlag } from '@/config/featureFlags';
import { useShortcutHelp, ShortcutConfig } from '@/hooks/useKeyboardShortcuts';
import { Keyboard, X, HelpCircle } from 'lucide-react';

interface ShortcutHelpProps {
  shortcuts: ShortcutConfig[];
  title?: string;
}

export function ShortcutHelp({
  shortcuts,
  title = 'キーボードショートカット',
}: ShortcutHelpProps) {
  const [isOpen, setIsOpen] = useState(false);
  const searchParams = useSearchParams();
  const shortcutsEnabled = useFeatureFlag('keyboard_shortcuts', searchParams);
  const { formatShortcut } = useShortcutHelp();

  if (!shortcutsEnabled) return null;

  const enabledShortcuts = shortcuts.filter((s) => s.enabled);

  if (enabledShortcuts.length === 0) return null;

  return (
    <>
      {/* ヘルプトリガーボタン */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 shadow-lg"
        title="キーボードショートカットヘルプ"
      >
        <Keyboard className="h-4 w-4 mr-1" />
        <span className="hidden sm:inline">ショートカット</span>
      </Button>

      {/* ヘルプモーダル */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Keyboard className="h-5 w-5" />
                  {title}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {enabledShortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center py-2 border-b last:border-b-0"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {shortcut.description}
                      </div>
                    </div>
                    <Badge variant="outline" className="font-mono text-xs">
                      {formatShortcut(shortcut)}
                    </Badge>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-start gap-2 text-sm text-blue-800">
                  <HelpCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">ご注意</p>
                    <p className="text-xs mt-1">
                      入力フィールド（テキストボックス等）にフォーカスがある時は、ショートカットは無効になります。
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

// クイックヘルプバッジ（小さい表示用）
export function QuickShortcutBadge({ shortcut }: { shortcut: ShortcutConfig }) {
  const searchParams = useSearchParams();
  const shortcutsEnabled = useFeatureFlag('keyboard_shortcuts', searchParams);
  const { formatShortcut } = useShortcutHelp();

  if (!shortcutsEnabled || !shortcut.enabled) return null;

  return (
    <Badge variant="outline" className="text-xs font-mono ml-2">
      {formatShortcut(shortcut)}
    </Badge>
  );
}
