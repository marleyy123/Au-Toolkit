import React, { useState, useEffect, useRef } from 'react';
import { Lock, KeyRound, ShieldAlert, X, ArrowRight, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { verifyAdminPin } from '../config/featureFlags';

interface PinAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  uiTheme?: 'light' | 'dark';
}

export const PinAuthModal: React.FC<PinAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  uiTheme = 'light',
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showPin, setShowPin] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError(null);
      setIsShaking(false);
      setIsSuccess(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    if (!pin.trim()) {
      setError('Please enter the developer passcode.');
      triggerShake();
      return;
    }

    if (verifyAdminPin(pin)) {
      setIsSuccess(true);
      setError(null);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 350);
    } else {
      setError('Incorrect passcode. Access restricted to authorized developers.');
      triggerShake();
      setPin('');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const isDark = uiTheme === 'dark';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 animate-in fade-in duration-150 select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`w-full max-w-xs sm:max-w-sm rounded-2xl shadow-2xl border p-6 overflow-hidden transition-all transform ${
          isShaking ? 'animate-shake' : ''
        } ${
          isDark
            ? 'bg-slate-900 border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-center">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs ${
                isSuccess
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  : isDark
                  ? 'bg-purple-950/60 text-purple-400 border border-purple-800/50'
                  : 'bg-purple-50 text-purple-600 border border-purple-100'
              }`}
            >
              {isSuccess ? <ShieldCheck className="w-6 h-6" /> : <KeyRound className="w-6 h-6" />}
            </div>
          </div>

          {/* PIN Input Field */}
          <div className="space-y-1.5">
            <div className="relative">
              <input
                ref={inputRef}
                type={showPin ? 'text' : 'password'}
                inputMode="numeric"
                pattern="[0-9]*"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Enter PIN"
                autoComplete="off"
                className={`w-full text-center text-base tracking-[0.2em] font-mono font-bold px-4 py-2.5 rounded-xl border outline-none transition-all ${
                  error
                    ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/10'
                    : isDark
                    ? 'bg-slate-800/80 border-slate-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20'
                    : 'bg-slate-50 border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:bg-white'
                }`}
              />

              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                title={showPin ? 'Hide PIN' : 'Show PIN'}
              >
                {showPin ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>

            {error && (
              <div className="flex items-center justify-center space-x-1.5 text-xs text-rose-500 font-medium pt-1 animate-in fade-in duration-150">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-1 flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 py-2 rounded-xl font-bold text-xs border transition-colors cursor-pointer ${
                isDark
                  ? 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSuccess}
              className={`flex-1 py-2 rounded-xl font-bold text-xs text-white transition-all shadow-md flex items-center justify-center space-x-1.5 cursor-pointer ${
                isSuccess
                  ? 'bg-purple-600 shadow-purple-500/20'
                  : 'bg-purple-600 hover:bg-purple-700 active:scale-[0.98] shadow-purple-500/20'
              }`}
            >
              {isSuccess ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Unlocked</span>
                </>
              ) : (
                <>
                  <span>Verify PIN</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
        .animate-shake {
          animation: shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }
      `}</style>
    </div>
  );
};
