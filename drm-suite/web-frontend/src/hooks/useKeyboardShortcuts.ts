'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { useFeatureFlag } from '@/config/featureFlags';

export interface ShortcutConfig {
  key: string;
  action: () => void;
  description: string;
  enabled?: boolean;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
}

export interface KeyboardShortcutsConfig {
  shortcuts: ShortcutConfig[];
  enabled: boolean;
}

export function useKeyboardShortcuts(config: KeyboardShortcutsConfig) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shortcutsEnabled = useFeatureFlag('keyboard_shortcuts', searchParams);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Feature Flag チェック
      if (!shortcutsEnabled || !config.enabled) return;

      // 入力フィールドにフォーカスがある場合はショートカットを無効化
      const activeElement = document.activeElement;
      const isInputFocused =
        activeElement &&
        (activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.tagName === 'SELECT' ||
          activeElement.getAttribute('contenteditable') === 'true');

      if (isInputFocused) return;

      // ショートカットの検索と実行
      const matchedShortcut = config.shortcuts.find((shortcut) => {
        if (!shortcut.enabled) return false;

        const keyMatch = event.key.toUpperCase() === shortcut.key.toUpperCase();
        const ctrlMatch = !!event.ctrlKey === !!shortcut.ctrlKey;
        const altMatch = !!event.altKey === !!shortcut.altKey;
        const shiftMatch = !!event.shiftKey === !!shortcut.shiftKey;

        return keyMatch && ctrlMatch && altMatch && shiftMatch;
      });

      if (matchedShortcut) {
        event.preventDefault();
        event.stopPropagation();
        matchedShortcut.action();
      }
    },
    [config, shortcutsEnabled],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return {
    shortcutsEnabled,
    availableShortcuts: config.shortcuts.filter((s) => s.enabled),
  };
}

// ショートカットヘルプ用のフック
export function useShortcutHelp() {
  const searchParams = useSearchParams();
  const shortcutsEnabled = useFeatureFlag('keyboard_shortcuts', searchParams);

  const formatShortcut = (shortcut: ShortcutConfig): string => {
    const parts = [];
    if (shortcut.ctrlKey) parts.push('Ctrl');
    if (shortcut.altKey) parts.push('Alt');
    if (shortcut.shiftKey) parts.push('Shift');
    parts.push(shortcut.key);
    return parts.join(' + ');
  };

  return {
    shortcutsEnabled,
    formatShortcut,
  };
}
