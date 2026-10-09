import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Lock, Mail, AlertCircle } from 'lucide-react';
import { supabase } from '../../supabaseClient.js';

interface SignUpProps {
  onSuccess?: () => void;
  onSwitchToSignIn?: (email?: string, message?: string) => void;
}

interface SignUpFormData {
  email: string;
  password: string;
}

export const SignUp: React.FC<SignUpProps> = ({ onSuccess, onSwitchToSignIn }) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormData>();

  const onSubmit = async (formData: SignUpFormData) => {
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined,
          data: {
            full_name: formData.email.split('@')[0],
          },
        },
      });

      if (error) {
        let msg = error.message;
        if (msg.toLowerCase().includes('already registered')) {
          msg = 'Email này đã được đăng ký. Vui lòng đăng nhập hoặc dùng email khác.';
        } else if (msg.toLowerCase().includes('password')) {
          msg = 'Mật khẩu không đáp ứng yêu cầu (tối thiểu 6 ký tự).';
        } else if (msg.toLowerCase().includes('rate limit')) {
          msg = 'Đã vượt quá giới hạn gửi yêu cầu. Vui lòng đợi trong giây lát và thử lại.';
        }
        setErrorMessage(msg);
        setIsLoading(false);
        return;
      }

      if (data?.user) {
        const isEmailConfirmed = Boolean(data.user.confirmed_at || data.session);
        const successMsg = isEmailConfirmed
          ? 'Đăng ký tài khoản thành công! Bạn có thể đăng nhập ngay bây giờ.'
          : 'Đăng ký thành công! Vui lòng kiểm tra hộp thư email để kích hoạt tài khoản trước khi đăng nhập.';

        // Store email and message in sessionStorage and query params for seamless state passing
        try {
          sessionStorage.setItem('signup_email', formData.email);
          sessionStorage.setItem('signup_message', successMsg);
          window.history.replaceState(
            {},
            '',
            `/login?email=${encodeURIComponent(formData.email)}&signup=success`
          );
        } catch {
          // ignore storage errors
        }

        setIsLoading(false);

        // Do NOT auto-login. Redirect user to Sign In page with pre-filled email and message
        if (onSwitchToSignIn) {
          onSwitchToSignIn(formData.email, successMsg);
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Đã xảy ra lỗi khi đăng ký.');
      setIsLoading(false);
    }
  };

  // Google OAuth sign in/sign up handler using supabaseClient.js
  const handleGoogleSignUp = async () => {
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) {
        setErrorMessage(error.message);
        setIsLoading(false);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Lỗi kết nối đăng nhập bằng Google.');
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Continue with Google button */}
      <button
        type="button"
        onClick={handleGoogleSignUp}
        disabled={isLoading}
        className="w-full py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-medium text-xs flex items-center justify-center gap-2.5 transition-colors cursor-pointer disabled:opacity-50"
      >
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span>Continue with Google</span>
      </button>

      {/* Divider */}
      <div className="relative my-3 flex items-center justify-center">
        <div className="border-t border-white/10 w-full" />
        <span className="bg-[var(--bg-card)] px-3 text-[10px] text-neutral-400 uppercase tracking-wider">
          hoặc
        </span>
        <div className="border-t border-white/10 w-full" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-neutral-300 mb-1.5">
            Địa chỉ Email
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
            <input
              type="email"
              placeholder="name@example.com"
              {...register('email', {
                required: 'Vui lòng nhập email',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Địa chỉ email không hợp lệ',
                },
              })}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-black/40 border border-[var(--border-subtle)] focus:border-[var(--accent)] rounded-xl text-white outline-none transition-colors"
            />
          </div>
          {errors.email && (
            <p className="text-[11px] text-red-400 mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-300 mb-1.5">
            Mật khẩu
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
            <input
              type="password"
              placeholder="Tối thiểu 6 ký tự"
              {...register('password', {
                required: 'Vui lòng nhập mật khẩu',
                minLength: {
                  value: 6,
                  message: 'Mật khẩu phải chứa ít nhất 6 ký tự',
                },
              })}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-black/40 border border-[var(--border-subtle)] focus:border-[var(--accent)] rounded-xl text-white outline-none transition-colors"
            />
          </div>
          {errors.password && (
            <p className="text-[11px] text-red-400 mt-1">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 mt-2 bg-[var(--accent)] hover:opacity-90 disabled:opacity-50 text-white font-semibold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center cursor-pointer"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Đang xử lý...
            </span>
          ) : (
            'Đăng ký tài khoản'
          )}
        </button>

        {/* Basic error handling if signup fails */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-300 mt-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}
      </form>
    </div>
  );
};
