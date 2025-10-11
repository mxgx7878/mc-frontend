// src/pages/public/RegisterClient.tsx
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
  UserPlus,
  ArrowLeft,
  Upload,
  X,
  Check,
  MapPin,
  CreditCard
} from 'lucide-react';
import toast from 'react-hot-toast';
import Autocomplete from 'react-google-autocomplete';

import { authAPI } from '../../api/handlers/auth.api';
import { useAuthStore } from '../../store/authStore';
import { clientRegistrationSchema, ClientRegistrationFormData } from '../../utils/validators';
import Input from '../../components/common/Input';
import Button from '../../components/common/Buttons';
import { useState } from 'react';

const RegisterClient = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    setValue,
    trigger,
  } = useForm<ClientRegistrationFormData>({
    resolver: zodResolver(clientRegistrationSchema),
  });

  const registerMutation = useMutation({
    mutationFn: authAPI.registerClient,
    onSuccess: (data: any) => {
      login(data.user, data.token);
      toast.success('🎉 Registration successful! Welcome to Material Connect');
      navigate('/client/dashboard');
    },
    onError: (error: any) => {
      if (error.errors && typeof error.errors === 'object') {
        Object.keys(error.errors).forEach((field) => {
          const messages = error.errors[field];
          const message = Array.isArray(messages) ? messages[0] : messages;
          setError(field as any, { type: 'manual', message });
        });
        toast.error('Please fix the errors in the form');
      } else {
        toast.error(error.message || 'Registration failed');
      }
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image size should be less than 2MB');
        return;
      }
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setProfileImage(null);
    setPreview(null);
  };

  const nextStep = async () => {
    const fields = steps[currentStep - 1].fields as Array<keyof ClientRegistrationFormData>;
    const isValid = await trigger(fields);
    if (isValid) {
      setCurrentStep(currentStep + 1);
    }
  };

  const onSubmit = (data: ClientRegistrationFormData) => {
  const submitData = {
    ...data,
    profile_image: profileImage || undefined,
  };
  
  console.log('📤 Submitting client data:', submitData);
  registerMutation.mutate(submitData);
};

  const steps = [
    { number: 1, title: 'Personal Info', fields: ['name', 'email', 'password'] },
    { number: 2, title: 'Contact Details', fields: ['contact_name', 'contact_number', 'company_name'] },
    { number: 3, title: 'Addresses', fields: ['shipping_address', 'billing_address'] },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 to-primary-50/30 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-secondary-600 hover:text-primary-600 mb-6 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Login
          </Link>
          <img
            src="https://demowebportals.com/material_connect/public/assets/img/logo-text.png"
            alt="Material Connect"
            className="h-12 mx-auto mb-4"
          />
          <h1 className="text-4xl font-bold text-secondary-900 mb-2">Create Client Account</h1>
          <p className="text-lg text-secondary-600">Join Material Connect to manage your construction projects</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-all
                    ${currentStep >= step.number 
                      ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/50' 
                      : 'bg-white text-secondary-400 border-2 border-secondary-200'
                    }
                  `}>
                    {currentStep > step.number ? <Check size={20} /> : step.number}
                  </div>
                  <span className={`text-sm mt-2 font-medium ${currentStep >= step.number ? 'text-primary-600' : 'text-secondary-400'}`}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-1 mx-4 rounded-full ${currentStep > step.number ? 'bg-primary-500' : 'bg-secondary-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-secondary-100">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <input type="hidden" {...register('lat', { valueAsNumber: true })} />
  <input type="hidden" {...register('long', { valueAsNumber: true })} />
            {/* Profile Image Upload */}
            {currentStep === 1 && (
              <div className="flex justify-center">
                <div className="relative">
                  {preview ? (
                    <div className="relative">
                      <img 
                        src={preview} 
                        alt="Preview" 
                        className="w-32 h-32 rounded-full object-cover border-4 border-primary-100 shadow-xl"
                      />
                      <button
                        type="button"
                        onClick={clearImage}
                        className="absolute -top-2 -right-2 p-2 bg-error-500 text-white rounded-full hover:bg-error-600 transition-colors shadow-lg"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer group">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                      <div className="w-32 h-32 rounded-full border-4 border-dashed border-secondary-300 bg-secondary-50 flex flex-col items-center justify-center hover:border-primary-500 hover:bg-primary-50 transition-all group-hover:scale-105">
                        <Upload size={32} className="text-secondary-400 group-hover:text-primary-500 mb-2" />
                        <span className="text-xs text-secondary-500 group-hover:text-primary-600 font-medium">Upload Photo</span>
                      </div>
                    </label>
                  )}
                </div>
              </div>
            )}

            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div className="space-y-5">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                    <User size={20} className="text-primary-600" />
                  </div>
                  <h3 className="text-xl font-bold text-secondary-900">Personal Information</h3>
                </div>

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
                  placeholder="john@company.com"
                  icon={Mail}
                  register={register('email')}
                  error={errors.email?.message}
                  required
                />

                <Input
                  label="Password"
                  type="password"
                  placeholder="Minimum 6 characters"
                  icon={Lock}
                  register={register('password')}
                  error={errors.password?.message}
                  required
                />
              </div>
            )}

            {/* Step 2: Contact Information */}
            {currentStep === 2 && (
              <div className="space-y-5">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                    <Phone size={20} className="text-primary-600" />
                  </div>
                  <h3 className="text-xl font-bold text-secondary-900">Contact Information</h3>
                </div>

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
                  placeholder="+92 300 1234567"
                  icon={Phone}
                  register={register('contact_number')}
                  error={errors.contact_number?.message}
                  required
                />

                <Input
                  label="Company Name (Optional)"
                  type="text"
                  placeholder="ABC Construction Ltd."
                  icon={Building2}
                  register={register('company_name')}
                  error={errors.company_name?.message}
                />
              </div>
            )}

            {/* Step 3: Address Information with Google Autocomplete */}
            {currentStep === 3 && (
              <div className="space-y-5">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                    <MapPin size={20} className="text-primary-600" />
                  </div>
                  <h3 className="text-xl font-bold text-secondary-900">Address Information</h3>
                </div>

                {/* Shipping Address + coords */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-secondary-700">
                    Shipping Address <span className="text-error-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3.5 text-secondary-400 z-10" size={20} />
                    <Autocomplete
                      apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
                      onPlaceSelected={(place: any) => {
                        if (place.formatted_address) {
                          setValue('shipping_address', place.formatted_address);
                          trigger('shipping_address');
                        }
                        if (place.geometry?.location) {
                          const lat = place.geometry.location.lat();
                          const lng = place.geometry.location.lng();
                          setValue('lat', lat);
                          setValue('long', lng);
                          trigger(['lat', 'long']);
                        }
                      }}
                      options={{ types: ['address'], componentRestrictions: { country: 'pk' } }}
                      className={`
                        w-full pl-10 pr-4 py-3 rounded-lg border-2 transition-all
                        ${errors.shipping_address
                          ? 'border-error-500 focus:border-error-500 focus:ring-error-500'
                          : 'border-secondary-200 focus:border-primary-500 focus:ring-primary-500'}
                        focus:outline-none focus:ring-2 focus:ring-opacity-20
                      `}
                      placeholder="Start typing your address..."
                      {...register('shipping_address')}
                    />
                  </div>
                  {errors.shipping_address && (
                    <p className="text-sm text-error-500">{errors.shipping_address.message}</p>
                  )}
                </div>

                {/* Billing Address input (plain text or use another Autocomplete if you prefer) */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-secondary-700">
                    Billing Address <span className="text-error-500">*</span>
                  </label>
                  <Input
                    label=""            // hidden label, we already show above
                    type="text"
                    placeholder="Same as shipping or enter a different address"
                    icon={CreditCard}
                    register={register('billing_address')}
                    error={errors.billing_address?.message}
                    required
                  />
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-4 pt-6 border-t border-secondary-200">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(currentStep - 1)}
                  fullWidth={false}
                  className="flex-1"
                >
                  <ArrowLeft size={20} />
                  Previous
                </Button>
              )}
              
              {currentStep < 3 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  fullWidth={currentStep === 1}
                  className={currentStep > 1 ? 'flex-1' : ''}
                >
                  Continue
                  <Check size={20} />
                </Button>
              ) : (
                <Button
                  type="submit"
                  isLoading={registerMutation.isPending}
                  disabled={registerMutation.isPending}
                  className="flex-1"
                >
                  <UserPlus size={20} />
                  {registerMutation.isPending ? 'Creating Account...' : 'Create Account'}
                </Button>
              )}
            </div>

            {/* Login Link */}
            <p className="text-center text-sm text-secondary-600 pt-4">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-700 font-semibold">
                Sign In
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterClient;