import { useEffect, useMemo, useState } from 'react';
import { getStoredAuthUser, onAuthUserChanged } from '../../../firebase';
import { getUserAccountStorageKey } from '../../workspace/workspaceStorage';
import { detectDeviceSlot } from '../../../utils/deviceAuthService';
import { EntitlementCheckResult } from '../../../services/buyerEntitlementService';
import { AuthLifecycleStage } from '../components/AppLoadingScreen';

export function useAuthSessionState() {
  const [authUser, setAuthUser] = useState<any>(() => {
    try {
      const stored = getStoredAuthUser();
      if (stored && (stored.email || stored.uid)) return stored;
    } catch {
      return null;
    }
    return null;
  });

  useEffect(() => {
    const unsubscribe = onAuthUserChanged((user) => {
      setAuthUser(user);
    });
    return () => unsubscribe();
  }, []);

  const userAccountKey = useMemo(() => getUserAccountStorageKey(authUser), [authUser]);

  const [authLifecycleStage, setAuthLifecycleStage] = useState<AuthLifecycleStage>(() => {
    try {
      const emailOrCode = localStorage.getItem('au_user_email') || localStorage.getItem('au_access_code');
      if (!emailOrCode) return 'UNAUTHENTICATED';
      return 'AUTH_LOADING';
    } catch {
      return 'UNAUTHENTICATED';
    }
  });
  const [buyerEntitlement, setBuyerEntitlement] = useState<EntitlementCheckResult | null>(null);
  const [loadingErrorMessage, setLoadingErrorMessage] = useState<string | null>(null);
  const [accessCode, setAccessCode] = useState<string>(() => {
    try {
      return localStorage.getItem('au_user_email') || localStorage.getItem('au_access_code') || '';
    } catch {
      return '';
    }
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const emailOrCode = localStorage.getItem('au_user_email') || localStorage.getItem('au_access_code');
      if (!emailOrCode) return false;
      const expiryStr = localStorage.getItem('au_session_expires_at');
      if (expiryStr) {
        const expiry = parseInt(expiryStr, 10);
        if (!isNaN(expiry) && Date.now() > expiry) {
          return false;
        }
      }
      return true;
    } catch {
      return false;
    }
  });
  const [clientDeviceSlot] = useState<'mobile' | 'desktop'>(() => detectDeviceSlot());

  return {
    authUser,
    setAuthUser,
    userAccountKey,
    authLifecycleStage,
    setAuthLifecycleStage,
    buyerEntitlement,
    setBuyerEntitlement,
    loadingErrorMessage,
    setLoadingErrorMessage,
    accessCode,
    setAccessCode,
    isAuthenticated,
    setIsAuthenticated,
    clientDeviceSlot,
  };
}
