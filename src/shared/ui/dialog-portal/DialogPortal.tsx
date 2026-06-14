import { useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';

const emptySubscribe = () => () => {};
function getIsMounted() { return true; }
function getIsNotMounted() { return false; }

export function DialogPortal({ children }: { children: React.ReactNode }) {
  const mounted = useSyncExternalStore(emptySubscribe, getIsMounted, getIsNotMounted);
  if (!mounted) return null;
  const el = document.getElementById('dialog-root');
  if (!el) return null;
  return createPortal(children, el);
}
