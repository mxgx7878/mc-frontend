// src/components/profile/ChangePasswordSection.tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { ChevronDown, Lock, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

import { profileAPI } from '../../api/handlers/profile.api';
import { useAuthStore } from '../../store/authStore';
import { changePasswordSchema, ChangePasswordFormData } from '../../utils/validators';
import Input from '../common/Input';
import Button from '../common/Buttons';

const ChangePasswordSection = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { setToken } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const changePasswordMutation = useMutation({
    mutationFn: profileAPI.changePassword,
    onSuccess: (data) => {
      // Update token if backend returns a new one
      if (data.token) {
        setToken(data.token);
      }
      
      toast.success('🔒 Password changed successfully!');
      reset(); // Clear form
      setIsExpanded(false); // Collapse section
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to change password');
    },
  });

  const onSubmit = (data: ChangePasswordFormData) => {
    changePasswordMutation.mutate(data);
  };

  return (
    <div className="border-t border-secondary-200 pt-8 mt-8">
      {/* Header - Always Visible */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-left group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-error-100 flex items-center justify-center group-hover:bg-error-200 transition-colors">
            <Shield size={20} className="text-error-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-secondary-900">
              Security Settings
            </h3>
            <p className="text-sm text-secondary-500">
              Update your password to keep your account secure
            </p>
          </div>
        </div>
        <ChevronDown
          size={24}
          className={`text-secondary-400 transition-transform duration-200 ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="mt-6 bg-secondary-50 rounded-xl p-6 border border-secondary-200">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="flex items-center gap-2 mb-4 text-sm text-secondary-600">
              <Lock size={16} />
              <span>Your password must be at least 6 characters long</span>
            </div>

            <Input
              label="Current Password"
              type="password"
              placeholder="Enter your current password"
              icon={Lock}
              register={register('current_password')}
              error={errors.current_password?.message}
              required
            />

            <Input
              label="New Password"
              type="password"
              placeholder="Enter new password (min. 6 characters)"
              icon={Lock}
              register={register('new_password')}
              error={errors.new_password?.message}
              required
            />

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="Re-enter new password"
              icon={Lock}
              register={register('new_password_confirmation')}
              error={errors.new_password_confirmation?.message}
              required
            />

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                isLoading={changePasswordMutation.isPending}
                disabled={changePasswordMutation.isPending}
                fullWidth={false}
                className="flex-1"
              >
                <Lock size={18} />
                {changePasswordMutation.isPending
                  ? 'Changing Password...'
                  : 'Change Password'}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  reset();
                  setIsExpanded(false);
                }}
                fullWidth={false}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChangePasswordSection;