// src/pages/public/Login.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

import { authAPI } from '../../api/handlers/auth.api';
import { useAuthStore } from '../../store/authStore';
import { loginSchema } from '../../utils/validators';
import type { LoginFormData } from '../../utils/validators';
import Input from '../../components/common/Input';
import Button from '../../components/common/Buttons'; // Changed from Buttons

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();

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
    const map: Record<string,string> = {
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
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 p-12 flex-col justify-between relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <img
            src="https://demowebportals.com/material_connect/public/assets/img/logo-text.png"
            alt="Material Connect"
            className="h-10 mb-8 brightness-0 invert"
          />
          <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
            Welcome to<br />Material Connect
          </h1>
          <p className="text-xl text-white/90 leading-relaxed">
            Streamline your construction material procurement with intelligent supplier matching and automated ordering.
          </p>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">Smart Supplier Matching</h3>
              <p className="text-white/80">AI-powered location-based supplier selection</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">Real-time Tracking</h3>
              <p className="text-white/80">Monitor orders from placement to delivery</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-secondary-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <img
              src="https://demowebportals.com/material_connect/public/assets/img/logo-text.png"
              alt="Material Connect"
              className="h-10 mx-auto mb-4"
            />
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 border border-secondary-100">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-secondary-900 mb-2">Sign In</h2>
              <p className="text-secondary-600">Access your Material Connect account</p>
            </div>

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
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 text-primary-500 rounded border-secondary-300 focus:ring-primary-500" />
                  <span className="text-secondary-600">Remember me</span>
                </label>
                <a href="#" className="text-primary-600 hover:text-primary-700 font-medium">
                  Forgot password?
                </a>
              </div>

              <Button
                type="submit"
                isLoading={loginMutation.isPending}
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? 'Signing in...' : (
                  <>
                    Sign In
                    <ArrowRight size={20} />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-secondary-200">
              <p className="text-center text-sm text-secondary-600 mb-4">
                New to Material Connect?
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  to="/register/client"
                  className="px-4 py-3 text-sm font-medium text-center text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-all hover:scale-105"
                >
                  Register as Client
                </Link>
                <Link
                  to="/register/supplier"
                  className="px-4 py-3 text-sm font-medium text-center text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-all hover:scale-105"
                >
                  Register as Supplier
                </Link>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-secondary-500 mt-6">
            By signing in, you agree to our{' '}
            <a href="#" className="text-primary-600 hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-primary-600 hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;