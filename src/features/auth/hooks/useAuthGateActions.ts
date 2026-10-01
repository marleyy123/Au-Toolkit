import { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { auth, getStoredAuthUser, loadUserWorkspaceFromFirestore, setStoredAuthUser } from '../../../firebase';
import { verifyAndRegisterDevice } from '../../../utils/deviceAuthService';
import { EntitlementCheckResult } from '../../../services/buyerEntitlementService';
import { AuthLifecycleStage } from '../components/AppLoadingScreen';

interface UseAuthGateActionsArgs {
  authUser: any;
  authLifecycleStage: AuthLifecycleStage;
  applyCloudWorkspaceDataRef: MutableRefObject<(cloudWorkspace: any, isInitial?: boolean) => void>;
  isHydratedRef: MutableRefObject<boolean>;
  setAccessCode: Dispatch<SetStateAction<string>>;
  setIsAuthenticated: Dispatch<SetStateAction<boolean>>;
  setLogoutReason: Dispatch<SetStateAction<string | null>>;
  setAuthUser: Dispatch<SetStateAction<any>>;
  setBuyerEntitlement: Dispatch<SetStateAction<EntitlementCheckResult | null>>;
  setAuthLifecycleStage: Dispatch<SetStateAction<AuthLifecycleStage>>;
  setIsHydrated: Dispatch<SetStateAction<boolean>>;
  setIsInitialCloudLoading: Dispatch<SetStateAction<boolean>>;
  setLoadingErrorMessage: Dispatch<SetStateAction<string | null>>;
  revalidateEntitlement: (isInitial?: boolean) => void;
}

export function useAuthGateActions({
  authUser,
  authLifecycleStage,
  applyCloudWorkspaceDataRef,
  isHydratedRef,
  setAccessCode,
  setIsAuthenticated,
  setLogoutReason,
  setAuthUser,
  setBuyerEntitlement,
  setAuthLifecycleStage,
  setIsHydrated,
  setIsInitialCloudLoading,
  setLoadingErrorMessage,
  revalidateEntitlement,
}: UseAuthGateActionsArgs) {
  const handleBackToLogin = () => {
    console.log('[Auth] User navigating back to login from loading screen');
    setLoadingErrorMessage(null);
    setIsAuthenticated(false);
    setAuthUser(null);
    setStoredAuthUser(null);
    setAuthLifecycleStage('UNAUTHENTICATED');
    try {
      localStorage.removeItem('au_is_authenticated');
    } catch {}
  };

  const handleContextAwareRetry = () => {
    setLoadingErrorMessage(null);
    if (authLifecycleStage === 'CHECK_ACCESS' || authLifecycleStage === 'AUTH_LOADING') {
      console.log('[Retry] Retrying entitlement verification for stage:', authLifecycleStage);
      revalidateEntitlement(true);
    } else if (authLifecycleStage === 'LOAD_USER_DATA' || authLifecycleStage === 'HYDRATE_DATA') {
      console.log('[Retry] Retrying Firestore workspace load for stage:', authLifecycleStage);
      const userEmailOrId = authUser?.uid || auth.currentUser?.uid;
      if (userEmailOrId) {
        const requestedUid = userEmailOrId;
        setIsInitialCloudLoading(true);
        loadUserWorkspaceFromFirestore(userEmailOrId)
          .then((cloudWorkspace) => {
            if (auth.currentUser?.uid !== requestedUid) return;
            setIsInitialCloudLoading(false);
            if (cloudWorkspace?.hasLoadedData) {
              applyCloudWorkspaceDataRef.current(cloudWorkspace, true);
            }
            setAuthLifecycleStage('READY');
          })
          .catch((err) => {
            console.error('[Retry] Firestore load error:', err);
            setIsInitialCloudLoading(false);
            setLoadingErrorMessage('Gagal memuat workspace dari cloud. Silakan coba lagi.');
          });
      } else {
        handleBackToLogin();
      }
    } else {
      revalidateEntitlement(true);
    }
  };

  const handleLoginSuccess = async (code: string, user: any, entitlement?: EntitlementCheckResult | null) => {
    setAccessCode(code);
    setIsAuthenticated(true);
    setLogoutReason(null);
    if (user) {
      setAuthUser(user);
    }
    if (entitlement) {
      setBuyerEntitlement(entitlement);
    }
    setAuthLifecycleStage('LOAD_USER_DATA');
    verifyAndRegisterDevice(user || code).catch(() => {});
    if (!user?.uid) {
      setIsHydrated(true);
      isHydratedRef.current = true;
      setIsInitialCloudLoading(false);
      setAuthLifecycleStage('READY');
    }
  };

  const handleAccessExpired = (_email: string, entitlement: EntitlementCheckResult) => {
    setBuyerEntitlement(entitlement);
    setAuthLifecycleStage('ACCESS_EXPIRED');
  };

  return {
    handleBackToLogin,
    handleContextAwareRetry,
    handleLoginSuccess,
    handleAccessExpired,
  };
}
