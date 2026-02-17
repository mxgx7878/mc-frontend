// src/pages/public/Login.tsx
// Redesigned: Clean white/light layout with teal accents (logo color #2caeb6)
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Mail, Lock, ArrowRight, Truck, ShieldCheck, Clock, HardHat } from 'lucide-react';
import toast from 'react-hot-toast';
import { useEffect, useRef } from 'react';
import { authAPI } from '../../api/handlers/auth.api';
import { useAuthStore } from '../../store/authStore';
import { loginSchema } from '../../utils/validators';
import type { LoginFormData } from '../../utils/validators';
import Input from '../../components/common/Input';
import Button from '../../components/common/Buttons';

const LOGO_URL = 'https://demowebportals.com/material_connect/public/assets/img/logo-text.png';

const Login = () => {
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const login = useAuthStore((s) => s.login);
  const checkAuth = useAuthStore.getState().checkAuth;
  const checkingRef = useRef(false);

  useEffect(() => {
    if (!token || checkingRef.current) return;
    checkingRef.current = true;
    (async () => {
      const ok = await checkAuth();
      if (ok) {
        const { user } = useAuthStore.getState();
        const map: Record<string, string> = {
          admin: '/admin/dashboard',
          client: '/client/dashboard',
          supplier: '/supplier/dashboard',
          accountant: '/admin/dashboard',
          support: '/admin/dashboard',
        };
        navigate(map[user?.role ?? 'client'] || '/login', { replace: true });
      }
      checkingRef.current = false;
    })();
  }, [token, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const loginMutation = useMutation({
    mutationFn: authAPI.login,
    retry: false,
    onSuccess: (data: any) => {
      login(data.user, data.token);
      toast.success(`Welcome back, ${data.user.name}!`);
      const map: Record<string, string> = {
        admin: '/admin/dashboard',
        client: '/client/dashboard',
        supplier: '/supplier/dashboard',
      };
      navigate(map[data.user.role] || '/login');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Invalid credentials');
    },
  });

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-secondary-50 flex flex-col">
      {/* Top accent bar */}
      <div className="h-1 bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600" />

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[460px]">
          {/* Logo & Tagline */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-6">
              <img
                src={LOGO_URL}
                alt="Material Connect"
                className="h-12"
                onError={(e) => {
                  const el = e.target as HTMLImageElement;
                  el.style.display = 'none';
                  const fallback = el.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              {/* Fallback if logo fails to load */}
              <div className="hidden items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-primary-500 flex items-center justify-center">
                  <HardHat className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-extrabold text-secondary-900 tracking-tight">
                  Material<span className="text-primary-500">Connect</span>
                </span>
              </div>
            </div>
            <p className="text-secondary-500 text-sm">
              Sign in to manage your construction materials
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-2xl shadow-card border border-secondary-100 p-8">
            <h2 className="text-xl font-bold text-secondary-900 mb-6">
              Welcome back
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <Input
                label="Email Address"
                type="email"
                placeholder="you@company.com"
                icon={Mail}
                register={register('email')}
                error={errors.email?.message}
                required
              />

              <Input
                label="Password"
                type="password"
                placeholder="Enter your password"
                icon={Lock}
                register={register('password')}
                error={errors.password?.message}
                required
              />

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-primary-500 rounded border-secondary-300 focus:ring-primary-500"
                  />
                  <span className="text-secondary-600 group-hover:text-secondary-800 transition-colors">
                    Remember me
                  </span>
                </label>
                <a
                  href="#"
                  className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
                >
                  Forgot password?
                </a>
              </div>

              <Button
                type="submit"
                isLoading={loginMutation.isPending}
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  'Signing in...'
                ) : (
                  <>
                    Sign In
                    <ArrowRight size={18} />
                  </>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-7">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-secondary-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-secondary-400 font-medium uppercase tracking-wider">
                  New here?
                </span>
              </div>
            </div>

            {/* Register Links */}
            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/register/client"
                className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-primary-700 bg-primary-50 rounded-xl border border-primary-100 hover:bg-primary-100 hover:border-primary-200 transition-all"
              >
                Register as Client
              </Link>
              <Link
                to="/register/supplier"
                className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-primary-700 bg-primary-50 rounded-xl border border-primary-100 hover:bg-primary-100 hover:border-primary-200 transition-all"
              >
                Register as Supplier
              </Link>
            </div>
          </div>

          {/* Trust indicators */}
          <div className="mt-8 grid grid-cols-3 gap-4">
            {[
              { icon: Truck, label: 'Same-Day Delivery' },
              { icon: ShieldCheck, label: 'Trusted Suppliers' },
              { icon: Clock, label: '24/7 Ordering' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-1.5 text-center">
                <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-primary-600" />
                </div>
                <span className="text-xs text-secondary-500 font-medium leading-tight">
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-secondary-400 mt-8">
            By signing in, you agree to our{' '}
            <a href="#" className="text-primary-600 hover:underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-primary-600 hover:underline">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;