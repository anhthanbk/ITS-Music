import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient.js';

interface ProtectedRouteProps {
  children: React.ReactNode;
  onRedirectToLogin?: () => void;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, onRedirectToLogin }) => {
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!isMounted) return;

      if (!data.session) {
        setHasSession(false);
        // Redirect to /login
        window.history.pushState({}, '', '/login');
        if (onRedirectToLogin) {
          onRedirectToLogin();
        }
      } else {
        setHasSession(true);
      }
    };

    verifySession();

    return () => {
      isMounted = false;
    };
  }, [onRedirectToLogin]);

  if (hasSession === null) {
    return (
      <div className="flex items-center justify-center py-20 text-xs text-neutral-400">
        <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
        Đang kiểm tra phiên đăng nhập...
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div className="p-12 text-center rounded-2xl bg-white/5 border border-white/10 my-8 max-w-lg mx-auto">
        <h3 className="text-base font-bold text-white mb-2">Trang yêu cầu đăng nhập</h3>
        <p className="text-xs text-neutral-400 mb-4">
          Trang này được bảo vệ. Vui lòng đăng nhập bằng tài khoản Supabase của bạn để tiếp tục.
        </p>
        <button
          type="button"
          onClick={() => {
            window.history.pushState({}, '', '/login');
            if (onRedirectToLogin) onRedirectToLogin();
          }}
          className="px-5 py-2 text-xs font-semibold text-white bg-[var(--accent)] hover:opacity-90 rounded-xl shadow-lg transition-all cursor-pointer"
        >
          Đăng nhập ngay
        </button>
      </div>
    );
  }

  return <>{children}</>;
};
