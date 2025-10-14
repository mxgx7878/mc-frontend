// src/pages/shared/ProfileSettings.tsx
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  MapPin, 
  Save,
  Camera,
  X,
  Truck,
  Home,
  Package,
  ShoppingCart,
  FolderOpen,
  Settings,
  BarChart,
  Users,
  DollarSign
} from 'lucide-react';
import toast from 'react-hot-toast';
import Autocomplete from 'react-google-autocomplete';

import { profileAPI } from '../../api/handlers/profile.api';
import { useAuthStore } from '../../store/authStore';
import { profileUpdateSchema } from '../../utils/validators';
import type { ProfileUpdateFormData } from '../../utils/validators';
import Input from '../../components/common/Input';
import Button from '../../components/common/Buttons';
import ChangePasswordSection from '../../components/profile/ChangePasswordSection';
import DashboardLayout from '../../components/layout/DashboardLayout';

const ProfileSettings = () => {
  const { user, updateUser } = useAuthStore();
  const [previewImage, setPreviewImage] = useState<string | null>(
    user?.profile_image ? `${import.meta.env.VITE_IMAGE_BASE_URL}${user.profile_image}` : null
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(
    user?.lat && user?.long ? { lat: user.lat, lng: user.long } : null
  );

  const {
    register,
    handleSubmit,
    formState: { errors, dirtyFields },
    setValue,
    reset,
  } = useForm<ProfileUpdateFormData>({
    resolver: zodResolver(profileUpdateSchema),
  });

  // // Refetch user data on mount to ensure fresh data
  // const { refetch } = useQuery({
  //   queryKey: ['currentUser'],
  //   queryFn: profileAPI.getCurrentUser,
  //   onSuccess: (data: any) => {
  //     updateUser(data.user);
  //   },
  // });

  // ✅ Update form values whenever user data changes (including company)
  useEffect(() => {
    if (user) {
      reset({
        name: user.name || '',
        email: user.email || '',
        contact_name: user.contact_name || '',
        contact_number: user.contact_number || '',
        company_name: user.company?.name || '',
        shipping_address: user.shipping_address || '',
        billing_address: user.billing_address || '',
        location: user.location || '',
        delivery_radius: user.delivery_radius || undefined,
      });

      // Update location coords if available
      if (user.lat && user.long) {
        setLocationCoords({ lat: user.lat, lng: user.long });
      }

      // Update preview image if available
      if (user.profile_image) {
        setPreviewImage(`${import.meta.env.VITE_IMAGE_BASE_URL}${user.profile_image}`);
      }
    }
  }, [user, reset]);

  const updateProfileMutation = useMutation({
    mutationFn: profileAPI.updateProfile,
    onSuccess: (data) => {
      updateUser(data.user);
      toast.success('✅ Profile updated successfully!');
      
      // Update preview image if new one was uploaded
      if (data.user.profile_image) {
        setPreviewImage(`${import.meta.env.VITE_IMAGE_BASE_URL}${data.user.profile_image}`);
      }
      
      // ✅ Reset form with updated values including company name
      reset({
        name: data.user.name,
        email: data.user.email,
        contact_name: data.user.contact_name,
        contact_number: data.user.contact_number,
        company_name: data.user.company?.name || '', // ✅ Fixed: Get from company
        shipping_address: data.user.shipping_address,
        billing_address: data.user.billing_address,
        location: data.user.location,
        delivery_radius: data.user.delivery_radius,
      });
      
      setImageFile(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update profile');
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image size should be less than 2MB');
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setPreviewImage(user?.profile_image ? `${import.meta.env.VITE_IMAGE_BASE_URL}${user.profile_image}` : null);
    setImageFile(null);
  };

  const handleShippingAddressSelect = (place: any) => {
    if (place.formatted_address) {
      setValue('shipping_address', place.formatted_address, { shouldDirty: true });
    }

    if (place.geometry?.location) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();

      setLocationCoords({ lat, lng });
      setValue('lat', lat, { shouldDirty: true });
      setValue('long', lng, { shouldDirty: true });

      toast.success(`📍 Location updated: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    }
  };

  const handleSupplierLocationSelect = (place: any) => {
    if (place.formatted_address) {
      setValue('location', place.formatted_address, { shouldDirty: true });
    }
  };

  const onSubmit = (data: ProfileUpdateFormData) => {
    // Build payload with only dirty fields
    const changedData: any = {};

    Object.keys(dirtyFields).forEach((key) => {
      const typedKey = key as keyof ProfileUpdateFormData;
      changedData[key] = data[typedKey];
    });

    // Add image if changed
    if (imageFile) {
      changedData.profile_image = imageFile;
    }

    // Validate: if shipping_address changed for client, lat/lng must be included
    if (
      user?.role === 'client' &&
      dirtyFields.shipping_address &&
      (!changedData.lat || !changedData.long)
    ) {
      toast.error('Please select a valid address with location coordinates');
      return;
    }

    // Check if there are any changes
    if (Object.keys(changedData).length === 0) {
      toast('No changes detected', { icon: 'ℹ️' });
      return;
    }

    updateProfileMutation.mutate(changedData);
  };

  // ✅ Define menu items based on user role
  const getMenuItems = () => {
    if (user?.role === 'client') {
      return [
        { label: 'Dashboard', path: '/client/dashboard', icon: <Home size={20} /> },
        { label: 'Projects', path: '/client/projects', icon: <FolderOpen size={20} /> },
        { label: 'Orders', path: '/client/orders', icon: <ShoppingCart size={20} /> },
        { label: 'Products', path: '/client/products', icon: <Package size={20} /> },
        { label: 'Profile', path: '/client/profile', icon: <User size={20} /> },
        { label: 'Settings', path: '/client/settings', icon: <Settings size={20} /> },
      ];
    } else if (user?.role === 'supplier') {
      return [
        { label: 'Dashboard', path: '/supplier/dashboard', icon: <Home size={20} /> },
        { label: 'My Products', path: '/supplier/products', icon: <Package size={20} /> },
        { label: 'Orders', path: '/supplier/orders', icon: <DollarSign size={20} /> },
        { label: 'Delivery Zones', path: '/supplier/zones', icon: <MapPin size={20} /> },
        { label: 'Profile', path: '/supplier/profile', icon: <User size={20} /> },
        { label: 'Settings', path: '/supplier/settings', icon: <Settings size={20} /> },
      ];
    } else if (user?.role === 'admin') {
      return [
        { label: 'Dashboard', path: '/admin/dashboard', icon: <Home size={20} /> },
        { label: 'Users', path: '/admin/users', icon: <Users size={20} /> },
        { label: 'Products', path: '/admin/master-products', icon: <Package size={20} /> },
        { label: 'Supplier Delivery Zones', path: '/admin/supplier-zones', icon: <MapPin size={20} /> },
        { label: 'Orders', path: '/admin/orders', icon: <ShoppingCart size={20} /> },
        { label: 'Reports', path: '/admin/reports', icon: <BarChart size={20} /> },
        { label: 'Settings', path: '/admin/settings', icon: <Settings size={20} /> },
      ];
    }
    return [];
  };

  return (
    <DashboardLayout menuItems={getMenuItems()}>
      <div className="max-w-4xl mx-auto">{/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-secondary-900">Profile Settings</h1>
          <p className="text-secondary-600 mt-2">
            Manage your account information and preferences
          </p>
        </div>

        {/* Main Form Card */}
        <div className="bg-white rounded-2xl shadow-card p-8 mb-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Profile Image Section */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-4">
                Profile Photo
              </label>
              <div className="flex items-center gap-6">
                {/* Image Preview */}
                <div className="relative">
                  {previewImage ? (
                    <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-secondary-200">
                      <img
                        src={previewImage}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                      {imageFile && (
                        <button
                          type="button"
                          onClick={clearImage}
                          className="absolute -top-2 -right-2 p-1.5 bg-error-500 text-white rounded-full hover:bg-error-600 transition-colors shadow-lg"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-full border-4 border-dashed border-secondary-300 bg-secondary-50 flex items-center justify-center">
                      <User size={32} className="text-secondary-400" />
                    </div>
                  )}
                </div>

                {/* Upload Button */}
                <div className="flex-1">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-all font-medium">
                      <Camera size={18} />
                      {previewImage ? 'Change Photo' : 'Upload Photo'}
                    </div>
                  </label>
                  <p className="text-xs text-secondary-500 mt-2">
                    PNG, JPG, GIF up to 2MB
                  </p>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-secondary-200">
                <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                  <User size={20} className="text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-secondary-900">
                  Personal Information
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input
                  label="Full Name"
                  type="text"
                  placeholder="John Doe"
                  icon={User}
                  register={register('name')}
                  error={errors.name?.message}
                />

                <Input
                  label="Email Address"
                  type="email"
                  placeholder="john@example.com"
                  icon={Mail}
                  register={register('email')}
                  error={errors.email?.message}
                />
              </div>
            </div>

            {/* Contact Details */}
            <div className="space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-secondary-200">
                <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                  <Phone size={20} className="text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-secondary-900">
                  Contact Details
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input
                  label="Contact Person"
                  type="text"
                  placeholder="Jane Smith"
                  icon={User}
                  register={register('contact_name')}
                  error={errors.contact_name?.message}
                />

                <Input
                  label="Contact Number"
                  type="tel"
                  placeholder="+92 300 1234567"
                  icon={Phone}
                  register={register('contact_number')}
                  error={errors.contact_number?.message}
                />
              </div>

              <Input
                label="Company Name"
                type="text"
                placeholder="ABC Construction Ltd."
                icon={Building2}
                register={register('company_name')}
                error={errors.company_name?.message}
              />
            </div>

            {/* Client-Specific: Address Information */}
            {user?.role === 'client' && (
              <div className="space-y-5">
                <div className="flex items-center gap-3 pb-3 border-b border-secondary-200">
                  <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                    <MapPin size={20} className="text-primary-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-secondary-900">
                    Address Information
                  </h3>
                </div>

                {/* Shipping Address with Google Autocomplete */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-secondary-700">
                    Shipping Address
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3.5 text-secondary-400 z-10" size={20} />
                    <Autocomplete
                      apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
                      onPlaceSelected={handleShippingAddressSelect}
                      options={{ types: ['address'], componentRestrictions: { country: 'au' } }}
                      defaultValue={user?.shipping_address || ''}
                      className={`
                        w-full pl-10 pr-4 py-3 rounded-lg border-2 transition-all
                        ${errors.shipping_address
                          ? 'border-error-500 focus:border-error-500 focus:ring-error-500'
                          : 'border-secondary-200 focus:border-primary-500 focus:ring-primary-500'}
                        focus:outline-none focus:ring-2 focus:ring-opacity-20
                      `}
                      placeholder="Start typing your address..."
                    />
                  </div>
                  {errors.shipping_address && (
                    <p className="text-sm text-error-500">{errors.shipping_address.message}</p>
                  )}

                  {/* Location Coordinates Display */}
                  {locationCoords && (
                    <div className="bg-success-50 border border-success-200 rounded-lg p-3 mt-2">
                      <p className="text-xs text-success-700 font-medium flex items-center gap-2">
                        <MapPin size={14} />
                        Selected Location: {locationCoords.lat.toFixed(6)}, {locationCoords.lng.toFixed(6)}
                      </p>
                    </div>
                  )}
                </div>

                <Input
                  label="Billing Address"
                  type="text"
                  placeholder="Same as shipping or different address"
                  icon={Building2}
                  register={register('billing_address')}
                  error={errors.billing_address?.message}
                />
              </div>
            )}

            {/* Supplier-Specific: Business Location */}
            {user?.role === 'supplier' && (
              <div className="space-y-5">
                <div className="flex items-center gap-3 pb-3 border-b border-secondary-200">
                  <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                    <MapPin size={20} className="text-primary-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-secondary-900">
                    Business Location
                  </h3>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-secondary-700">
                    Business Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3.5 text-secondary-400 z-10" size={20} />
                    <Autocomplete
                      apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
                      onPlaceSelected={handleSupplierLocationSelect}
                      options={{ types: ['address'], componentRestrictions: { country: 'au' } }}
                      defaultValue={user?.location || ''}
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
                  {errors.location && (
                    <p className="text-sm text-error-500">{errors.location.message}</p>
                  )}
                </div>

                <Input
                  label="Delivery Radius (km)"
                  type="number"
                  placeholder="50"
                  icon={Truck}
                  register={register('delivery_radius', { valueAsNumber: true })}
                  error={errors.delivery_radius?.message}
                />
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-4 pt-6 border-t border-secondary-200">
              <Button
                type="submit"
                isLoading={updateProfileMutation.isPending}
                disabled={updateProfileMutation.isPending}
                fullWidth={false}
                className="flex-1"
              >
                <Save size={20} />
                {updateProfileMutation.isPending ? 'Saving Changes...' : 'Save Changes'}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  reset();
                  clearImage();
                  setLocationCoords(
                    user?.lat && user?.long ? { lat: user.lat, lng: user.long } : null
                  );
                }}
                fullWidth={false}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>

        {/* Change Password Section - Separate Card */}
        <div className="bg-white rounded-2xl shadow-card p-8">
          <ChangePasswordSection />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProfileSettings;