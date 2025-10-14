// src/pages/public/RegisterSupplier.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { 
  Mail, 
  Lock, 
  User, 
  Phone, 
  Building2, 
  MapPin, 
  UserPlus,
  ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';
import Autocomplete from 'react-google-autocomplete';
import { useState } from 'react';

import { authAPI } from '../../api/handlers/auth.api';
import { useAuthStore } from '../../store/authStore';
import { supplierRegistrationSchema } from '../../utils/validators';
import type { SupplierRegistrationFormData } from '../../utils/validators';
import Input from '../../components/common/Input';
import Button from '../../components/common/Buttons';
import ImageUpload from '../../components/common/ImageUpload';

const RegisterSupplier = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [profileImage, setProfileImage] = useState<File | null>(null);

  const {
    register,
    handleSubmit,

    formState: { errors },
    setError,
    setValue,
  } = useForm<SupplierRegistrationFormData>({
    resolver: zodResolver(supplierRegistrationSchema),
  });



  const registerMutation = useMutation({
    mutationFn: authAPI.registerSupplier,
    onSuccess: (data: any) => {
      login(data.user, data.token);
      toast.success('🎉 Registration successful! Welcome to Material Connect');
      navigate('/supplier/dashboard');
    },
    onError: (error: any) => {
      if (error.errors && typeof error.errors === 'object') {
        Object.keys(error.errors).forEach((field) => {
          const messages = error.errors[field];
          const message = Array.isArray(messages) ? messages[0] : messages;
          setError(field as any, {
            type: 'manual',
            message: message,
          });
        });
        toast.error('Please fix the errors in the form');
      } else {
        toast.error(error.message || 'Registration failed');
      }
    },
  });

  // ✅ FIXED: Pass data directly to API (FormData creation happens in API handler)
  const onSubmit = (data: SupplierRegistrationFormData) => {
    const submitData = {
      ...data,
      profile_image: profileImage || undefined,
    };
    
    console.log('📤 Submitting data:', submitData);
    registerMutation.mutate(submitData);
  };


  const profileImageError =
  typeof errors.profile_image?.message === 'string'
    ? errors.profile_image.message
    : undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-secondary-600 hover:text-primary-600 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Login
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <img
            src="https://demowebportals.com/material_connect/public/assets/img/logo-text.png"
            alt="Material Connect"
            className="h-12 mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold text-secondary-900">Create Supplier Account</h1>
          <p className="text-secondary-600 mt-2">Join our network and start supplying materials</p>
        </div>

        {/* Registration Form */}
        <div className="bg-white rounded-2xl shadow-card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Profile Image */}
            
            <ImageUpload
              label="Profile Image (Optional)"
              onChange={setProfileImage}
              error={profileImageError}
            />

            {/* Personal Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-secondary-900 border-b pb-2">
                Personal Information
              </h3>

              <Input
                label="Full Name"
                type="text"
                placeholder="John Doe"
                icon={User}
                register={register('name')}
                error={errors.name?.message}
                required
              />

              <Input
                label="Email Address"
                type="email"
                placeholder="supplier@example.com"
                icon={Mail}
                register={register('email')}
                error={errors.email?.message}
                required
              />

              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                icon={Lock}
                register={register('password')}
                error={errors.password?.message}
                required
              />
            </div>

            {/* Business Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-secondary-900 border-b pb-2">
                Business Information
              </h3>

              <Input
                label="Company Name"
                type="text"
                placeholder="ABC Materials Supplier"
                icon={Building2}
                register={register('company_name')}
                error={errors.company_name?.message}
                required
              />

              <Input
                label="Contact Person Name"
                type="text"
                placeholder="Jane Smith"
                icon={User}
                register={register('contact_name')}
                error={errors.contact_name?.message}
                required
              />

              <Input
                label="Contact Number"
                type="tel"
                placeholder="+61 400 123 456" 
                icon={Phone}
                register={register('contact_number')}
                error={errors.contact_number?.message}
                required
              />
            </div>

            {/* Location (Google Autocomplete) */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-secondary-900 border-b pb-2">
                Business Location
              </h3>

              {/* hidden field bound to RHF */}
              <input type="hidden" {...register('location')} />

              <label className="block text-sm font-medium text-secondary-700">
                Location <span className="text-error-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3.5 text-secondary-400 z-10" size={20} />
                <Autocomplete
                  apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
                  onPlaceSelected={(place: any) => {
                    const addr = place?.formatted_address ?? '';
                    setValue('location', addr, { shouldValidate: true, shouldDirty: true });
                  }}
                  options={{ types: ['address'], componentRestrictions: { country: 'au' } }}
                  className={`
                    w-full pl-10 pr-4 py-3 rounded-lg border-2 transition-all
                    ${errors.location
                      ? 'border-error-500 focus:border-error-500 focus:ring-error-500'
                      : 'border-secondary-200 focus:border-primary-500 focus:ring-primary-500'}
                    focus:outline-none focus:ring-2 focus:ring-opacity-20
                  `}
                  placeholder="Start typing your business address..."
                />
              </div>
              {errors.location && <p className="text-sm text-error-500">{errors.location.message}</p>}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              isLoading={registerMutation.isPending}
              disabled={registerMutation.isPending}
            >
              <UserPlus size={20} />
              {registerMutation.isPending ? 'Creating Account...' : 'Create Supplier Account'}
            </Button>

            {/* Login Link */}
            <p className="text-center text-sm text-secondary-600">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                Sign In
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterSupplier;