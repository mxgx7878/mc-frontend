// src/pages/admin/UserCreate.tsx
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  ArrowLeft,
  Save,
  User as UserIcon,
  Mail,
  Phone,
  Building2,
  MapPin,
  Truck,
  Home,
  Users,
  Package,
  ShoppingCart,
  Settings,
  BarChart,
  CreditCard,
  Lock
} from 'lucide-react';
import toast from 'react-hot-toast';
import Autocomplete from 'react-google-autocomplete';

import DashboardLayout from '../../components/layout/DashboardLayout';
import Button from '../../components/common/Buttons';
import Input from '../../components/common/Input';
import ImageUpload from '../../components/common/ImageUpload';
import { usersAPI, companiesAPI } from '../../api/handlers/users.api';

// Validation Schema
const userCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'client', 'supplier']),
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

type UserCreateFormData = z.infer<typeof userCreateSchema>;

const UserCreate = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null);

  const menuItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: <Home size={20} /> },
    { label: 'Users', path: '/admin/users', icon: <Users size={20} /> },
    { label: 'Products', path: '/admin/products', icon: <Package size={20} /> },
    { label: 'Orders', path: '/admin/orders', icon: <ShoppingCart size={20} /> },
    { label: 'Reports', path: '/admin/reports', icon: <BarChart size={20} /> },
    { label: 'Settings', path: '/admin/settings', icon: <Settings size={20} /> },
  ];

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<UserCreateFormData>({
    resolver: zodResolver(userCreateSchema),
    defaultValues: {
      role: 'client',
    },
  });

  const watchedRole = watch('role');

  // Fetch Companies
  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: companiesAPI.getAll,
  });

  // Create User Mutation
  const createUserMutation = useMutation({
    mutationFn: (formData: FormData) => usersAPI.createUser(formData),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['users']);
      toast.success('✅ User created successfully!');
      navigate('/admin/users');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to create user');
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
      toast.success(`📍 Location set: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    }
  }, [setValue]);

  const handleSupplierLocationSelect = useCallback((place: any) => {
    if (place.formatted_address) {
      setValue('location', place.formatted_address);
    }
  }, [setValue]);

  const onSubmit = (data: UserCreateFormData) => {
    const formData = new FormData();

    // Append all fields
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        if (typeof value === 'number') {
          formData.append(key, String(value));
        } else {
          formData.append(key, value);
        }
      }
    });

    // Append profile image
    if (profileImage) {
      formData.append('profile_image', profileImage);
    }

    // Append coordinates for clients
    if (data.role === 'client' && locationCoords) {
      formData.append('lat', String(locationCoords.lat));
      formData.append('long', String(locationCoords.lng));
    }

    createUserMutation.mutate(formData);
  };

  return (
    <DashboardLayout menuItems={menuItems}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/admin/users')}
            className="flex items-center gap-2 text-secondary-600 hover:text-primary-600 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Users
          </button>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-card p-8">
          <h1 className="text-3xl font-bold text-secondary-900 mb-2">Create New User</h1>
          <p className="text-secondary-600 mb-8">Add a new user to the system</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Profile Image */}
            <ImageUpload
              label="Profile Image (Optional)"
              onChange={setProfileImage}
            />

            {/* Basic Information */}
            <div className="space-y-5">
              <h3 className="text-lg font-semibold text-secondary-900 border-b pb-3">
                Basic Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input
                  label="Full Name"
                  type="text"
                  placeholder="John Doe"
                  icon={UserIcon}
                  register={register('name')}
                  error={errors.name?.message}
                  required
                />

                <Input
                  label="Email Address"
                  type="email"
                  placeholder="john@example.com"
                  icon={Mail}
                  register={register('email')}
                  error={errors.email?.message}
                  required
                />
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
                  </select>
                  {errors.role && (
                    <p className="text-sm text-error-500 mt-1">{errors.role.message}</p>
                  )}
                </div>

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
            </div>

            {/* Contact Details */}
            <div className="space-y-5">
              <h3 className="text-lg font-semibold text-secondary-900 border-b pb-3">
                Contact Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input
                  label="Contact Person"
                  type="text"
                  placeholder="Jane Smith"
                  icon={UserIcon}
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
                placeholder="ABC Construction Ltd"
                icon={Building2}
                register={register('company_name')}
                error={errors.company_name?.message}
              />
            </div>

            {/* Client-Specific Fields */}
            {watchedRole === 'client' && (
              <div className="space-y-5 border-t pt-6">
                <h3 className="text-lg font-semibold text-secondary-900 border-b pb-3 flex items-center gap-2">
                  <MapPin size={20} className="text-primary-600" />
                  Address Information (Client)
                </h3>

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
                      className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-secondary-200 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20"
                      placeholder="Start typing address..."
                    />
                  </div>
                  {errors.shipping_address && (
                    <p className="text-sm text-error-500">{errors.shipping_address.message}</p>
                  )}
                  {locationCoords && (
                    <div className="bg-success-50 border border-success-200 rounded-lg p-3">
                      <p className="text-xs text-success-700 font-medium flex items-center gap-2">
                        <MapPin size={14} />
                        Location: {locationCoords.lat.toFixed(6)}, {locationCoords.lng.toFixed(6)}
                      </p>
                    </div>
                  )}
                </div>

                <Input
                  label="Billing Address"
                  type="text"
                  placeholder="Same as shipping or different"
                  icon={CreditCard}
                  register={register('billing_address')}
                  error={errors.billing_address?.message}
                />
              </div>
            )}

            {/* Supplier-Specific Fields */}
            {watchedRole === 'supplier' && (
              <div className="space-y-5 border-t pt-6">
                <h3 className="text-lg font-semibold text-secondary-900 border-b pb-3 flex items-center gap-2">
                  <Truck size={20} className="text-success-600" />
                  Business Information (Supplier)
                </h3>

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
                      className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-secondary-200 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20"
                      placeholder="Start typing business address..."
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

            {/* Notes */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-secondary-700">
                Notes (Optional)
              </label>
              <textarea
                {...register('notes')}
                rows={4}
                placeholder="Add any additional notes about this user..."
                className="w-full px-4 py-3 rounded-lg border-2 border-secondary-200 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20"
              />
              {errors.notes && (
                <p className="text-sm text-error-500">{errors.notes.message}</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6 border-t border-secondary-200">
              <Button
                type="submit"
                isLoading={createUserMutation.isPending}
                disabled={createUserMutation.isPending}
                fullWidth={false}
                className="flex-1"
              >
                <Save size={20} />
                {createUserMutation.isPending ? 'Creating User...' : 'Create User'}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/admin/users')}
                fullWidth={false}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UserCreate;