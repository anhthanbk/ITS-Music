import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Lock, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../supabaseClient.js';
import { useAuthStore } from '../../store/useAuthStore';

interface SignInProps {
  prefilledEmail?: string;
  successMessage?: string;
  onSuccess?: () => void;
  onSwitchToSignUp?: () => void;
}

interface SignInFormData {
  email: string;
  password: string;
}

export const SignIn: React.FC<SignInProps> = ({
  prefilledEmail,
  successMessage,
  onSuccess,
  onSwitchToSignUp,
}) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [displaySuccessMessage, setDisplaySuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { checkSession } = useAuthStore();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<SignInFormData>({
    defaultValues: {
      email: prefilledEmail || '',
      password: '',
    },
  });

  // Pre-fill email and success message from props, URL query parameter, or sessionStorage
  useEffect(() => {
    let emailToFill = prefilledEmail;
    let messageToShow = successMessage;

    // Check query params if not provided by prop
    if (!emailToFill || !messageToShow) {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const urlEmail = searchParams.get('email');
        const urlSignup = searchParams.get('signup');

        if (urlEmail && !emailToFill) {
          emailToFill = urlEmail;
        }

        if (urlSignup === 'success' && !messageToShow) {
          messageToShow =
            'Your account has been created. Please check your email and verify your address before logging in.';
        }
      } catch {
        // ignore url parsing issues
      }
    }

    // Check sessionStorage fallback
    if (!emailToFill) {
      const storedEmail = sessionStorage.getItem('signup_email');
      if (storedEmail) {
        emailToFill = storedEmail;
        sessionStorage.removeItem('signup_email');
      }
    }

    if (!messageToShow) {
      const storedMsg = sessionStorage.getItem('signup_message');
      if (storedMsg) {
        messageToShow = storedMsg;
        sessionStorage.removeItem('signup_message');
      }
    }

    if (emailToFill) {
      setValue('email', emailToFill);
    }

    if (messageToShow) {
      setDisplaySuccessMessage(messageToShow);
    }
  }, [prefilledEmail, successMessage, setValue]);

  const onSubmit = async (formData: SignInFormData) => {
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        let msg = error.message;
        if (msg.toLowerCase().includes('invalid login credentials')) {
          msg = 'Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.';
        } else if (msg.toLowerCase().includes('email not confirmed')) {
          msg = 'Email chưa được xác thực. Vui lòng kiểm tra hộp thư email và bấm link kích hoạt tài khoản.';
        } else if (msg.toLowerCase().includes('too many requests') || msg.toLowerCase().includes('rate limit')) {
          msg = 'Bạn đã thử đăng nhập quá nhiều lần. Vui lòng thử lại sau vài phút.';
        }
        setErrorMessage(msg);
        setIsLoading(false);
        return;
      }

      // Only redirect when a real session exists after login
      if (data?.session) {
        await checkSession();
        if (onSuccess) onSuccess();
        window.history.pushState({}, '', '/');
        window.location.href = '/';
      } else {
        setErrorMessage('Tài khoản chưa được kích hoạt phiên làm việc. Vui lòng kiểm tra email kích hoạt hoặc đăng nhập lại.');
        setIsLoading(false);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Đã xảy ra lỗi khi đăng nhập.');
      setIsLoading(false);
    }
  };

  // Google OAuth sign in handler using supabaseClient.js
  const handleGoogleSignIn = async () => {
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
      {/* Clear success message above the form when user comes from a successful signup */}
      {displaySuccessMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-300 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span className="leading-relaxed font-medium">{displaySuccessMessage}</span>
        </div>
      )}

      {/* Continue with Google button */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
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
            'Đăng nhập ngay'
          )}
        </button>

        {/* Basic error handling if signin fails */}
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
