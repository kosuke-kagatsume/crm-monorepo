import { useEffect } from 'react';

function isTypingTarget(el: EventTarget | null) {
  return !!(
    el &&
    (el as HTMLElement).closest('input, textarea, [contenteditable="true"]')
  );
}

type Handlers = Partial<
  Record<'E' | 'C' | 'B' | 'N' | 'M' | 'R' | 'H', () => void>
>;

export function useHomeShortcuts(
  handlers: Handlers,
  opts?: { enabled?: boolean },
) {
  useEffect(() => {
    if (opts?.enabled === false) return;

    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return; // 入力中は無効化
      if (e.ctrlKey || e.metaKey || e.altKey) return; // 修飾キーがある場合は無視

      const k = e.key.toUpperCase() as keyof Handlers;
      const fn = handlers[k];
      if (fn) {
        e.preventDefault();
        fn();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [JSON.stringify(Object.keys(handlers)), opts?.enabled]);
}
