import { useState } from 'react';

export function useRagToggle() {
  const [open, setOpen] = useState(false);
  return { open, setOpen, toggle: () => setOpen(v => !v) };
}