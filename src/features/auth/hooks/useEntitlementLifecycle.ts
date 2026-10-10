import { Dispatch, SetStateAction, useCallback, useEffect, useRef } from 'react';
import { auth, getStoredAuthUser, setStoredAuthUser, signOutUser } from '../../../firebase';
import { checkBuyerEntitlement, EntitlementCheckResult } from '../../../services/buyerEntitlementService';
import { verifyAndRegisterDevice } from '../../../utils/deviceAuthService';
import { AuthLifecycleStage } from '../components/AppLoadingScreen';

interface UseEntitlementLifecycleArgs {
  authUser: any;
  authLifecycleStage: AuthLifecycleStage;
  isAuthenticated: boolean;
  language: string;
  buyerEntitlement: EntitlementCheckResult | null;
  setAuthUser: Dispatch<SetStateAction<any>>;
  setIsAuthenticated: Dispatch<SetStateAction<boolean>>;
  setAuthLifecycleStage: Dispatch<SetStateAction<AuthLifecycleStage>>;
  setLoadingErrorMessage: Dispatch<SetStateAction<string | null>>;
  setBuyerEntitlement: Dispatch<SetStateAction<EntitlementCheckResult | null>>;
  handleAutoLogout: (reason: string) => void;
}

export function useEntitlementLifecycle({
  authUser,
  authLifecycleStage,
  isAuthenticated,
  language,
  buyerEntitlement,
  setAuthUser,
  setIsAuthenticated,
  setAuthLifecycleStage,
  setLoadingErrorMessage,
  setBuyerEntitlement,
  handleAutoLogout,
}: UseEntitlementLifecycleArgs) {
  const isRevalidatingRef = useRef<boolean>(false);
  const lastRevalidatedAtRef = useRef<number>(0);
  const initialBootExecutedRef = useRef<boolean>(false);

  const authUserRef = useRef(authUser);
  authUserRef.current = authUser;
  const authLifecycleStageRef = useRef<AuthLifecycleStage>('UNAUTHENTICATED');
  authLifecycleStageRef.current = authLifecycleStage;
  const languageRef = useRef(language);
  languageRef.current = language;
  const buyerEntitlementRef = useRef(buyerEntitlement);
  buyerEntitlementRef.current = buyerEntitlement;

  const revalidateEntitlement = useCallback(async (isInitial = false) => {
    if (isRevalidatingRef.current) {
      console.log('[Entitlement] Revalidation already in-flight, skipping.');
      return;
    }

    const stored = getStoredAuthUser();
    const localEmail = localStorage.getItem('au_user_email');
    const emailToCheck = (stored?.email || localEmail || authUserRef.current?.email || '').trim().toLowerCase();

    if (!emailToCheck) {
      console.log('[Entitlement] No email found to check. Setting UNAUTHENTICATED.');
      if (isInitial) {
        setIsAuthenticated(false);
        setAuthLifecycleStage('UNAUTHENTICATED');
      }
      return;
    }

    const now = Date.now();
    if (!isInitial && (document.visibilityState !== 'visible' || now - lastRevalidatedAtRef.current < 5 * 60 * 1000)) {
      return;
    }

    isRevalidatingRef.current = true;
    try {
      if (isInitial) {
        setLoadingErrorMessage(null);
        setAuthLifecycleStage('CHECK_ACCESS');
      }

      console.log('[Entitlement] Checking buyer entitlement for:', emailToCheck, { isInitial });
      const requestedUid = auth.currentUser?.uid;
      const entitlement = await checkBuyerEntitlement(emailToCheck);
      if (requestedUid && auth.currentUser?.uid !== requestedUid) return;
      lastRevalidatedAtRef.current = Date.now();

      if (
        entitlement.status === 'BACKEND_ERROR' ||
        entitlement.status === 'INVALID_API_RESPONSE' ||
        entitlement.status === 'APPS_SCRIPT_UNAVAILABLE'
      ) {
        console.warn('[Entitlement] Temporary API/backend error:', entitlement.status);
        if (isInitial) {
          const cached = buyerEntitlementRef.current;
          const isCachedValid = Boolean(
            cached && cached.isValid && cached.status === 'ACTIVE' && cached.email?.toLowerCase() === emailToCheck
          );
          if (auth.app.options.projectId !== 'au-toolkit-staging-20261005' && isCachedValid && (auth.currentUser || getStoredAuthUser())) {
            console.log('[Entitlement] Using cached valid entitlement with active Firebase session, proceeding to LOAD_USER_DATA');
            setAuthLifecycleStage('LOAD_USER_DATA');
          } else {
            console.warn('[Entitlement] No active authenticated session or valid cached entitlement. Access blocked.');
            setLoadingErrorMessage(
              entitlement.message ||
                (languageRef.current === 'id'
                  ? 'Server verifikasi spreadsheet sedang tidak dapat dijangkau. Silakan coba lagi.'
                  : 'Spreadsheet verification server is currently unreachable. Please try again.')
            );
          }
        }
        return;
      }

      if (entitlement.status === 'AUTH_REQUIRED' || entitlement.status === 'INVALID_FIREBASE_TOKEN') {
        console.log('[Entitlement] Auth session required:', entitlement.status);
        if (isInitial) {
          setIsAuthenticated(false);
          setAuthLifecycleStage('UNAUTHENTICATED');
        }
        return;
      }

      const isStatusExpired = String(entitlement.statusAccount || '').trim().toLowerCase() === 'expired';
      const isExpiredOrLocked =
        entitlement.status === 'EXPIRED' ||
        isStatusExpired ||
        entitlement.status === 'INACTIVE' ||
        entitlement.statusAccount === 'Inactive' ||
        entitlement.status === 'DEVICE_MISMATCH' ||
        entitlement.status === 'ORDER_NOT_SUCCESS' ||
        entitlement.status === 'INVALID_PURCHASE_DATA';

      if (isExpiredOrLocked) {
        console.warn('[Entitlement] Access denied/expired:', entitlement.status, entitlement.statusAccount);
        setIsAuthenticated(false);
        setBuyerEntitlement(entitlement);
        setAuthLifecycleStage('ACCESS_EXPIRED');
        try {
          localStorage.setItem('au_is_authenticated', 'false');
          if (entitlement.expirationDate) {
            localStorage.setItem('au_buyer_expiration_date', entitlement.expirationDate);
          }
          if (entitlement.statusAccount) {
            localStorage.setItem('au_buyer_status_account', entitlement.statusAccount);
          }
        } catch {}
        return;
      }

      if (entitlement.status === 'NOT_REGISTERED' || !entitlement.isRegisteredBuyer) {
        console.warn('[Entitlement] Buyer not found in sheet:', emailToCheck);
        setBuyerEntitlement(entitlement);
        handleAutoLogout(
          entitlement.message ||
            (languageRef.current === 'id'
              ? 'Email tidak terdaftar sebagai pembeli aktif.'
              : 'Email is not registered as an active buyer.')
        );
        setAuthLifecycleStage('UNAUTHENTICATED');
        return;
      }

      console.log('[Entitlement] ACCESS_GRANTED for:', emailToCheck);
      setBuyerEntitlement(entitlement);
      try {
        localStorage.setItem('au_is_authenticated', 'true');
        if (entitlement.purchaseDate) localStorage.setItem('au_buyer_purchase_date', entitlement.purchaseDate);
        if (entitlement.expirationDate) localStorage.setItem('au_buyer_expiration_date', entitlement.expirationDate);
        if (entitlement.statusAccount) localStorage.setItem('au_buyer_status_account', entitlement.statusAccount);
      } catch {}

      const currentUser = auth.currentUser;
      if (currentUser && currentUser.email) {
        const googleEmail = (currentUser.email || '').trim().toLowerCase();
        const buyerEmail = (emailToCheck || '').trim().toLowerCase();
        if (googleEmail !== buyerEmail) {
          console.warn('[Auth] EMAIL_ACCOUNT_MISMATCH on revalidation:', { googleEmail, buyerEmail });
          await signOutUser();
          setIsAuthenticated(false);
          setAuthLifecycleStage('UNAUTHENTICATED');
          setLoadingErrorMessage(
            `Email akun Google (${googleEmail}) tidak cocok dengan email pembelian (${buyerEmail}) [EMAIL_ACCOUNT_MISMATCH]. Silakan masuk dengan akun Google ${buyerEmail}.`
          );
          return;
        }
      }

      const activeFirebaseUser: any = currentUser || getStoredAuthUser();
      if (!activeFirebaseUser || !currentUser) {
        console.log('[Auth] Google Sign-In required for verified buyer:', emailToCheck);
        setIsAuthenticated(false);
        setAuthLifecycleStage('UNAUTHENTICATED');
        return;
      }

      const userSession = {
        uid: currentUser.uid,
        email: emailToCheck,
        displayName: currentUser.displayName || emailToCheck.split('@')[0],
        photoURL: currentUser.photoURL || null,
      };

      setIsAuthenticated(true);
      setStoredAuthUser(userSession);
      setAuthUser(userSession);

      if (isInitial) {
        try {
          await verifyAndRegisterDevice(activeFirebaseUser);
        } catch (err) {
          console.warn('Device slot registration notice:', err);
        }
        console.log('[Lifecycle] Transitioning from CHECK_ACCESS -> LOAD_USER_DATA');
        setAuthLifecycleStage('LOAD_USER_DATA');
      } else if (authLifecycleStageRef.current === 'ACCESS_EXPIRED') {
        setAuthLifecycleStage('READY');
      }
    } catch (err: any) {
      console.error('[Entitlement] Verification unexpected error:', err);
      if (isInitial) {
        setLoadingErrorMessage(
          err?.message || 'Terjadi kesalahan saat memverifikasi hak akses. Silakan coba lagi.'
        );
      }
    } finally {
      isRevalidatingRef.current = false;
    }
  }, [
    handleAutoLogout,
    setAuthLifecycleStage,
    setAuthUser,
    setBuyerEntitlement,
    setIsAuthenticated,
    setLoadingErrorMessage,
  ]);

  useEffect(() => {
    if (initialBootExecutedRef.current) return;
    initialBootExecutedRef.current = true;
    console.log('[Lifecycle] Initial boot started, evaluating access...');
    revalidateEntitlement(true);
  }, [revalidateEntitlement]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isAuthenticated && authLifecycleStageRef.current === 'READY') {
        revalidateEntitlement(false);
      }
    };
    const handleFocus = () => {
      if (isAuthenticated && authLifecycleStageRef.current === 'READY') {
        revalidateEntitlement(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isAuthenticated, revalidateEntitlement]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const intervalId = setInterval(() => {
      if (authLifecycleStageRef.current !== 'READY') return;
      if (document.visibilityState !== 'visible') return;
      revalidateEntitlement(false);
    }, 5 * 60 * 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [isAuthenticated, revalidateEntitlement]);

  return { revalidateEntitlement };
}
