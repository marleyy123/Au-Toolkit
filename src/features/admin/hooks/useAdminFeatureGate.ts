import { useEffect, useRef } from 'react';

interface UseAdminFeatureGateArgs {
  setIsPinModalOpen: (open: boolean) => void;
  setFeatureFlagsVersion: (updater: (version: number) => number) => void;
}

export function useAdminFeatureGate({
  setIsPinModalOpen,
  setFeatureFlagsVersion,
}: UseAdminFeatureGateArgs) {
  const secretClickCountRef = useRef<number>(0);
  const secretLastClickTimeRef = useRef<number>(0);

  const handleSecretFooterClick = () => {
    const now = Date.now();
    if (now - secretLastClickTimeRef.current < 1500) {
      secretClickCountRef.current += 1;
    } else {
      secretClickCountRef.current = 1;
    }
    secretLastClickTimeRef.current = now;

    if (secretClickCountRef.current >= 3) {
      secretClickCountRef.current = 0;
      setIsPinModalOpen(true);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.ctrlKey || e.metaKey;
      if (isCmdOrCtrl && e.shiftKey && (e.key === 'F' || e.key === 'f')) {
        e.preventDefault();
        setIsPinModalOpen(true);
      } else if (isCmdOrCtrl && e.altKey && (e.key === 'F' || e.key === 'f')) {
        e.preventDefault();
        setIsPinModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsPinModalOpen]);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (
        params.get('admin') === 'true' ||
        params.get('admin') === 'ff' ||
        params.get('flag') === 'admin' ||
        params.get('ff') === 'admin'
      ) {
        setIsPinModalOpen(true);
      }
    } catch {}
  }, [setIsPinModalOpen]);

  useEffect(() => {
    const handleFlagsUpdated = () => {
      setFeatureFlagsVersion((v) => v + 1);
    };
    window.addEventListener('feature_flags_updated', handleFlagsUpdated);
    return () => window.removeEventListener('feature_flags_updated', handleFlagsUpdated);
  }, [setFeatureFlagsVersion]);

  return { handleSecretFooterClick };
}
