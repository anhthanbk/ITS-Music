import React, { useState } from 'react';
import { X } from 'lucide-react';
import { SignIn } from '../auth/SignIn';
import { SignUp } from '../auth/SignUp';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [prefilledEmail, setPrefilledEmail] = useState('');
  const [signupSuccessMsg, setSignupSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSwitchToSignIn = (email?: string, message?: string) => {
    if (email) setPrefilledEmail(email);
    if (message) setSignupSuccessMsg(message);
    setMode('login');
  };

  const handleSwitchToSignUp = () => {
    setSignupSuccessMsg('');
    setMode('register');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[var(--text-secondary)] hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              ITS Music
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-neutral-300 font-mono">
              Supabase Auth
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {mode === 'login' ? 'Đăng nhập tài khoản' : 'Đăng ký tài khoản mới'}
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {mode === 'login'
              ? 'Nghe nhạc chất lượng cao, đồng bộ playlist và quản lý bài hát yêu thích'
              : 'Tạo tài khoản miễn phí để lưu trữ playlist trên đám mây Supabase'}
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1 p-1 bg-black/30 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => handleSwitchToSignIn()}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              mode === 'login'
                ? 'bg-[var(--accent)] text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            onClick={handleSwitchToSignUp}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              mode === 'register'
                ? 'bg-[var(--accent)] text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Đăng ký
          </button>
        </div>

        {/* Form view */}
        {mode === 'login' ? (
          <SignIn
            prefilledEmail={prefilledEmail}
            successMessage={signupSuccessMsg}
            onSuccess={onClose}
            onSwitchToSignUp={handleSwitchToSignUp}
          />
        ) : (
          <SignUp
            onSuccess={onClose}
            onSwitchToSignIn={handleSwitchToSignIn}
          />
        )}

        <div className="mt-5 pt-4 border-t border-[var(--border-subtle)] text-center text-xs text-[var(--text-secondary)]">
          {mode === 'login' ? (
            <p>
              Chưa có tài khoản?{' '}
              <button
                type="button"
                onClick={handleSwitchToSignUp}
                className="text-[var(--accent)] hover:underline font-medium cursor-pointer"
              >
                Đăng ký tài khoản mới
              </button>
            </p>
          ) : (
            <p>
              Đã có tài khoản?{' '}
              <button
                type="button"
                onClick={() => handleSwitchToSignIn()}
                className="text-[var(--accent)] hover:underline font-medium cursor-pointer"
              >
                Đăng nhập tại đây
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
