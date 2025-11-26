// src/pages/admin/UserEdit.tsx - WORKING VERSION
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  ArrowLeft,
  Save,
  User as UserIcon,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import Autocomplete from 'react-google-autocomplete';

// ✅ IMPORT YOUR ACTUAL API HANDLERS
import { usersAPI } from '../../api/handlers/users.api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { adminMenuItems } from '../../utils/menuItems';

// Validation Schema
const userEditSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
  role: z.enum(['admin', 'client', 'supplier','support','accountant']),
  contact_name: z.string().optional(),
  contact_number: z.string().optional(),
  company_name: z.string().optional(),
  location: z.string().optional(),
  delivery_radius: z.number().optional(),
  shipping_address: z.string().optional(),
  billing_address: z.string().optional(),
  lat: z.number().optional(),
  long: z.number().optional(),
  notes: z.string().optional(),
});

type UserEditFormData = z.infer<typeof userEditSchema>;

const UserEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null);


  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<UserEditFormData>({
    resolver: zodResolver(userEditSchema),
  });

  const watchedRole = watch('role');

  // ✅ FIXED: Fetch User Data using your actual API
  const { data: user, isLoading, isError, error } = useQuery({
    queryKey: ['user', id],
    queryFn: () => usersAPI.getUser(Number(id)),
    enabled: !!id,
    retry: 1, // Only retry once
  });

  // ✅ Debug: Log the response
  useEffect(() => {
    if (user) {
      console.log('✅ User data loaded:', user);
    }
    if (error) {
      console.error('❌ Error loading user:', error);
    }
  }, [user, error]);

  // ✅ FIXED: Use useEffect to populate form when user data loads
  useEffect(() => {
    if (user) {
      console.log('📥 Populating form with user data');
      
      // Reset form with user data
      reset({
        name: user.name || '',
        email: user.email || '',
        role: user.role || 'client',
        contact_name: user.contact_name || '',
        contact_number: user.contact_number || '',
        company_name: user.company?.name || '', // ✅ Get from nested company object
        location: user.location || '',
        delivery_radius: user.delivery_radius || undefined,
        shipping_address: user.shipping_address || '',
        billing_address: user.billing_address || '',
        notes: user.notes || '',
      });

      // Set location coordinates
      if (user.lat && user.long) {
        setLocationCoords({ lat: user.lat, lng: user.long });
      }

      // Set profile image URL
      if (user.profile_image) {
        const imageUrl = `${import.meta.env.VITE_IMAGE_BASE_URL}${user.profile_image}`;
        setCurrentImageUrl(imageUrl);
        console.log('🖼️ Profile image URL:', imageUrl);
      }
    }
  }, [user, reset]);

 

  // Update User Mutation
  const updateUserMutation = useMutation({
    mutationFn: (formData: FormData) => usersAPI.updateUser(Number(id), formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', id] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('✅ User updated successfully!');
      navigate(`/admin/users/${id}`);
    },
    onError: (error: any) => {
      console.error('❌ Update error:', error);
      toast.error(error?.message || 'Failed to update user');
    },
  });

  const handleShippingAddressSelect = useCallback((place: any) => {
    if (place.formatted_address) {
      setValue('shipping_address', place.formatted_address);
    }
    if (place.geometry?.location) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      setLocationCoords({ lat, lng });
      setValue('lat', lat);
      setValue('long', lng);
      toast.success(`📍 Location updated: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    }
  }, [setValue]);

  const handleSupplierLocationSelect = useCallback((place: any) => {
    if (place.formatted_address) {
      setValue('location', place.formatted_address);
    }
  }, [setValue]);

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
      reader.onloadend = () => setCurrentImageUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = (data: UserEditFormData) => {
    console.log('📤 Submitting form data:', data);
    
    const formData = new FormData();

    // Append all fields
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && value !== null) {
        if (typeof value === 'number') {
          formData.append(key, String(value));
        } else {
          formData.append(key, value);
        }
      }
    });

    // Append profile image if changed
    if (profileImage) {
      formData.append('profile_image', profileImage);
      console.log('🖼️ Including new profile image');
    }

    // Append coordinates for clients
    if (data.role === 'client' && locationCoords) {
      formData.append('lat', String(locationCoords.lat));
      formData.append('long', String(locationCoords.lng));
      console.log('📍 Including coordinates:', locationCoords);
    }

    updateUserMutation.mutate(formData);
  };

  // Loading State
  if (isLoading) {
    return (
      <DashboardLayout menuItems={adminMenuItems}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
            <p className="text-secondary-600">Loading user data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Error State
  if (isError || !user) {
    return (
      <DashboardLayout menuItems={adminMenuItems}>
        <div className="text-center py-12">
          <p className="text-error-500 mb-4 text-xl">❌ Failed to load user data</p>
          <p className="text-secondary-600 mb-4">
            {error instanceof Error ? error.message : 'Unknown error occurred'}
          </p>
          <button
            onClick={() => navigate('/admin/users')}
            className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors inline-flex items-center gap-2"
          >
            <ArrowLeft size={20} />
            Back to Users
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout menuItems={adminMenuItems}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(`/admin/users/${id}`)}
            className="flex items-center gap-2 text-secondary-600 hover:text-primary-600 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to User Details
          </button>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-card p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-secondary-900">Edit User</h1>
            <p className="text-secondary-600 mt-2">Update user information and settings</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Profile Image */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-secondary-700">
                Profile Photo
              </label>
              <div className="flex items-center gap-6">
                <div className="relative">
                  {currentImageUrl ? (
                    <img
                      src={currentImageUrl}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover border-4 border-secondary-200"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-secondary-200 flex items-center justify-center">
                      <UserIcon size={40} className="text-secondary-400" />
                    </div>
                  )}
                </div>
                <div>
                  <label className="cursor-pointer inline-block px-4 py-2 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    Change Photo
                  </label>
                  <p className="text-xs text-secondary-500 mt-2">PNG, JPG, GIF up to 2MB</p>
                </div>
              </div>
            </div>

            {/* Basic Information */}
            <div className="space-y-5">
              <h3 className="text-lg font-semibold text-secondary-900 border-b pb-3">
                Basic Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Full Name <span className="text-error-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('name')}
                    className="w-full px-4 py-3 rounded-lg border-2 border-secondary-200 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20"
                  />
                  {errors.name && (
                    <p className="text-sm text-error-500 mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Email <span className="text-error-500">*</span>
                  </label>
                  <input
                    type="email"
                    {...register('email')}
                    className="w-full px-4 py-3 rounded-lg border-2 border-secondary-200 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20"
                  />
                  {errors.email && (
                    <p className="text-sm text-error-500 mt-1">{errors.email.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Role <span className="text-error-500">*</span>
                  </label>
                  <select
                    {...register('role')}
                    className="w-full px-4 py-3 rounded-lg border-2 border-secondary-200 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20"
                  >
                    <option value="admin">Admin</option>
                    <option value="client">Client</option>
                    <option value="supplier">Supplier</option>
                    <option value="accountant">Accountant</option>
                    <option value="support">Support</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Password (leave blank to keep current)
                  </label>
                  <input
                    type="password"
                    {...register('password')}
                    placeholder="Enter new password"
                    className="w-full px-4 py-3 rounded-lg border-2 border-secondary-200 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20"
                  />
                  {errors.password && (
                    <p className="text-sm text-error-500 mt-1">{errors.password.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Information */}
            {(watchedRole === 'client' || watchedRole === 'supplier')  && (
            <div className="space-y-5">
              <h3 className="text-lg font-semibold text-secondary-900 border-b pb-3">
                Contact Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    {...register('contact_name')}
                    className="w-full px-4 py-3 rounded-lg border-2 border-secondary-200 focus:outline-none focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Contact Number
                  </label>
                  <input
                    type="tel"
                    {...register('contact_number')}
                    className="w-full px-4 py-3 rounded-lg border-2 border-secondary-200 focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  {...register('company_name')}
                  className="w-full px-4 py-3 rounded-lg border-2 border-secondary-200 focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>
            )}
            {/* Client-Specific Fields */}
            {watchedRole === 'client' && (
              <div className="space-y-5 border-t pt-6">
                <h3 className="text-lg font-semibold text-secondary-900 pb-3">
                  Address Information (Client)
                </h3>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Shipping Address
                  </label>
                  <Autocomplete
                    apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
                    onPlaceSelected={handleShippingAddressSelect}
                    options={{ types: ['address'], componentRestrictions: { country: 'au' } }}
                    defaultValue={user?.shipping_address || ''}
                    className="w-full px-4 py-3 rounded-lg border-2 border-secondary-200 focus:border-primary-500"
                    placeholder="Start typing address..."
                  />
                  {locationCoords && (
                    <p className="text-xs text-success-600 mt-2">
                      📍 Location: {locationCoords.lat.toFixed(6)}, {locationCoords.lng.toFixed(6)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Billing Address
                  </label>
                  <input
                    type="text"
                    {...register('billing_address')}
                    className="w-full px-4 py-3 rounded-lg border-2 border-secondary-200 focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>
            )}

            {/* Supplier-Specific Fields */}
            {watchedRole === 'supplier' && (
              <div className="space-y-5 border-t pt-6">
                <h3 className="text-lg font-semibold text-secondary-900 pb-3">
                  Business Information (Supplier)
                </h3>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Business Location
                  </label>
                  <Autocomplete
                    apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
                    onPlaceSelected={handleSupplierLocationSelect}
                    options={{ types: ['address'], componentRestrictions: { country: 'au' } }}
                    defaultValue={user?.location || ''}
                    className="w-full px-4 py-3 rounded-lg border-2 border-secondary-200 focus:border-primary-500"
                    placeholder="Start typing business address..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Delivery Radius (km)
                  </label>
                  <input
                    type="number"
                    {...register('delivery_radius', { valueAsNumber: true })}
                    className="w-full px-4 py-3 rounded-lg border-2 border-secondary-200 focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                {...register('notes')}
                rows={4}
                className="w-full px-4 py-3 rounded-lg border-2 border-secondary-200 focus:outline-none focus:border-primary-500"
                placeholder="Add any additional notes..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6 border-t border-secondary-200">
              <button
                type="submit"
                disabled={updateUserMutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm hover:shadow-md"
              >
                {updateUserMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    Save Changes
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate(`/admin/users/${id}`)}
                className="flex-1 px-6 py-3 border-2 border-secondary-300 text-secondary-700 rounded-lg hover:bg-secondary-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UserEdit;