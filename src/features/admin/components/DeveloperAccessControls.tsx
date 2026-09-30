import React from 'react';
import { PinAuthModal } from '../../auth/components/PinAuthModal';
import { FeatureFlagManagerModal } from '../../../components/FeatureFlagManagerModal';
import { UiTheme } from '../../../context/ThemeContext';

interface DeveloperAccessControlsProps {
  uiTheme: UiTheme;
  isPinModalOpen: boolean;
  isFeatureFlagModalOpen: boolean;
  onSecretFooterClick: () => void;
  onClosePinModal: () => void;
  onPinSuccess: () => void;
  onCloseFeatureFlagModal: () => void;
}

export const DeveloperAccessControls: React.FC<DeveloperAccessControlsProps> = ({
  uiTheme,
  isPinModalOpen,
  isFeatureFlagModalOpen,
  onSecretFooterClick,
  onClosePinModal,
  onPinSuccess,
  onCloseFeatureFlagModal,
}) => (
  <>
    <footer className="py-2.5 px-4 text-center select-none shrink-0 border-t border-slate-200/60 dark:border-slate-800/60 bg-inherit">
      <span
        onClick={onSecretFooterClick}
        className="text-[11px] font-medium text-slate-400 dark:text-slate-500 hover:text-slate-500 dark:hover:text-slate-400 transition-colors cursor-default"
        title="AU Toolkit"
      >
        AU Toolkit
      </span>
    </footer>

    <PinAuthModal
      isOpen={isPinModalOpen}
      onClose={onClosePinModal}
      onSuccess={onPinSuccess}
      uiTheme={uiTheme}
    />

    <FeatureFlagManagerModal
      isOpen={isFeatureFlagModalOpen}
      onClose={onCloseFeatureFlagModal}
      uiTheme={uiTheme}
    />
  </>
);
