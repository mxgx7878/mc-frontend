// src/components/order/Step2_ProjectDelivery.tsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  MapPin,
  Calendar,
  FileText,
  Building2,
  Plus,
  ChevronDown,
  Search,
  User,
  Phone,
  AlertCircle,
  Edit2,
  RotateCcw,
  Minus,
  Trash2,
} from 'lucide-react';
import Autocomplete from 'react-google-autocomplete';
import { orderFormSchema } from '../../utils/validators';
import type { OrderFormValues } from '../../utils/validators';
import type { CartItem, Project } from '../../types/order.types';
import Button from '../common/Buttons';
import Input from '../common/Input';

interface Step2Props {
  cartItems: CartItem[];
  projects: Project[];
  onSubmit: (data: OrderFormValues) => void;
  onBack: () => void;
  isSubmitting: boolean;
  onCreateProject?: () => void;
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onRemoveItem: (productId: number) => void;
  onUpdateCustomBlend?: (productId: number, blend: string) => void;
}

const Step2_ProjectDelivery: React.FC<Step2Props> = ({
  cartItems,
  projects,
  onSubmit,
  onBack,
  isSubmitting,
  onCreateProject,
  onUpdateQuantity,
  onRemoveItem,
  onUpdateCustomBlend,
}) => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [projectSearchTerm, setProjectSearchTerm] = useState('');
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressKey, setAddressKey] = useState(0);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
  });

  const watchDeliveryAddress = watch('delivery_address');
  // const watchDeliveryLat = watch('delivery_lat');
  // const watchDeliveryLong = watch('delivery_long');
   const getImageUrl = (photo: string | null | undefined): string => {
    // Return fallback image if photo is null, undefined, or empty
    if (!photo) {
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjZTVlN2ViIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMCIgZmlsbD0iIzljYTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
    }

    return photo.startsWith('http')
      ? photo
      : `${import.meta.env.VITE_IMAGE_BASE_URL}storage/${photo}`;
  };

  useEffect(() => {
    if (projects.length === 1 && !selectedProject) {
      handleProjectSelect(projects[0]);
    }
  }, [projects]);

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
    setValue('project_id', project.id, { shouldValidate: true });
    
    if (project.delivery_address && project.delivery_lat && project.delivery_long) {
      setValue('delivery_address', project.delivery_address, { shouldValidate: true });
      setValue('delivery_lat', Number(project.delivery_lat), { shouldValidate: true });
      setValue('delivery_long', Number(project.delivery_long), { shouldValidate: true });
      setIsEditingAddress(false);
      setAddressKey(prev => prev + 1);
    }
    
    setShowProjectDropdown(false);
    setProjectSearchTerm('');
  };

  const handlePlaceSelected = (place: any) => {
    if (place.formatted_address) {
      setValue('delivery_address', place.formatted_address, { shouldValidate: true });
    }
    if (place.geometry?.location) {
      const lat = Number(place.geometry.location.lat());
      const lng = Number(place.geometry.location.lng());
      setValue('delivery_lat', lat, { shouldValidate: true });
      setValue('delivery_long', lng, { shouldValidate: true });
    }
  };

  const handleResetToProjectAddress = () => {
    if (selectedProject?.delivery_address && selectedProject?.delivery_lat && selectedProject?.delivery_long) {
      setValue('delivery_address', selectedProject.delivery_address, { shouldValidate: true });
      setValue('delivery_lat', Number(selectedProject.delivery_lat), { shouldValidate: true });
      setValue('delivery_long', Number(selectedProject.delivery_long), { shouldValidate: true });
      setIsEditingAddress(false);
      setAddressKey(prev => prev + 1);
    }
  };

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(projectSearchTerm.toLowerCase())
  );

  const handleQuantityChange = (productId: number, value: string) => {
    const quantity = parseInt(value);
    if (!isNaN(quantity) && quantity > 0) {
      onUpdateQuantity(productId, quantity);
    }
  };

  const handleIncrement = (productId: number, currentQuantity: number) => {
    onUpdateQuantity(productId, currentQuantity + 1);
  };

  const handleDecrement = (productId: number, currentQuantity: number) => {
    if (currentQuantity > 1) {
      onUpdateQuantity(productId, currentQuantity - 1);
    }
  };

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* LEFT: Order Summary with EDITABLE QUANTITIES */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-5 lg:sticky lg:top-6">
            <h3 className="font-bold text-secondary-900 mb-4 flex items-center gap-2">
              <FileText size={20} className="text-primary-600" />
              Order Summary
            </h3>

            <div className="space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item.product_id}
                  className="pb-4 border-b border-secondary-100 last:border-0"
                >
                  {/* Product Info */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-14 h-14 rounded-lg bg-secondary-100 flex-shrink-0 overflow-hidden">
                      <img
                        src={getImageUrl(item.product_photo)}
                        alt={item.product_name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjZTVlN2ViIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMCIgZmlsbD0iIzljYTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-secondary-900 text-sm">
                        {item.product_name}
                      </p>
                      <p className="text-xs text-secondary-600 mt-1">
                        {item.product_type}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Remove ${item.product_name}?`)) {
                          onRemoveItem(item.product_id);
                        }
                      }}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Remove item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDecrement(item.product_id, item.quantity)}
                      disabled={item.quantity <= 1}
                      className={`w-8 h-8 rounded-lg border flex items-center justify-center ${
                        item.quantity <= 1
                          ? 'border-secondary-200 text-secondary-400 cursor-not-allowed'
                          : 'border-secondary-300 hover:border-primary-500 hover:bg-primary-50 text-secondary-700'
                      }`}
                    >
                      <Minus size={14} />
                    </button>
                    
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(item.product_id, e.target.value)}
                      min="1"
                      className="w-16 px-2 py-1.5 border border-secondary-300 rounded-lg text-center text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    
                    <button
                      type="button"
                      onClick={() => handleIncrement(item.product_id, item.quantity)}
                      className="w-8 h-8 rounded-lg border border-secondary-300 hover:border-primary-500 hover:bg-primary-50 text-secondary-700 flex items-center justify-center"
                    >
                      <Plus size={14} />
                    </button>
                    
                    <span className="text-xs text-secondary-600 ml-1">
                      {item.unit_of_measure}
                    </span>
                  </div>

                  {/* Custom Blend Input */}
                  {onUpdateCustomBlend && (
                    <div className="mt-3">
                      <input
                        type="text"
                        value={item.custom_blend_mix || ''}
                        onChange={(e) => onUpdateCustomBlend(item.product_id, e.target.value)}
                        placeholder="Custom blend (optional)"
                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-secondary-200 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-secondary-600">Total Items:</span>
                <span className="font-bold text-secondary-900">{cartItems.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-secondary-600">Total Quantity:</span>
                <span className="font-bold text-secondary-900">{totalItems} units</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-secondary-200">
              <Button
                type="button"
                onClick={onBack}
                variant="outline"
                className="w-full"
              >
                ← Add More Products
              </Button>
            </div>
          </div>
        </div>

        {/* RIGHT: Form Fields */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Project Selection */}
          <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
            {/* Validation Errors Summary */}
            {Object.keys(errors).length > 0 && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
                  <div>
                    <p className="text-sm font-semibold text-red-900">Please fix the following errors:</p>
                    <ul className="mt-2 text-sm text-red-800 list-disc list-inside space-y-1">
                      {Object.entries(errors).map(([key, error]) => (
                        <li key={key}>{error.message}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="text-primary-600" size={22} />
              <h3 className="font-bold text-secondary-900">Select Project</h3>
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowProjectDropdown(!showProjectDropdown)}
                className={`
                  w-full flex items-center justify-between px-4 py-3 border rounded-lg
                  transition-all
                  ${
                    selectedProject
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-secondary-300 bg-white hover:border-primary-400'
                  }
                `}
              >
                <span className={selectedProject ? 'text-secondary-900 font-medium' : 'text-secondary-500'}>
                  {selectedProject ? selectedProject.name : 'Choose a project...'}
                </span>
                <ChevronDown
                  size={20}
                  className={`transition-transform ${showProjectDropdown ? 'rotate-180' : ''}`}
                />
              </button>

              {showProjectDropdown && (
                <div className="absolute z-10 w-full mt-2 bg-white border border-secondary-300 rounded-lg shadow-lg max-h-80 overflow-hidden">
                  <div className="p-3 border-b border-secondary-200">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" size={18} />
                      <input
                        type="text"
                        placeholder="Search projects..."
                        value={projectSearchTerm}
                        onChange={(e) => setProjectSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>

                  <div className="max-h-60 overflow-y-auto">
                    {filteredProjects.length > 0 ? (
                      filteredProjects.map((project) => (
                        <button
                          key={project.id}
                          type="button"
                          onClick={() => handleProjectSelect(project)}
                          className="w-full px-4 py-3 text-left hover:bg-secondary-50 transition-colors border-b border-secondary-100 last:border-0"
                        >
                          <p className="font-medium text-secondary-900">{project.name}</p>
                          {project.site_contact_name && (
                            <p className="text-sm text-secondary-600 mt-1">Contact: {project.site_contact_name}</p>
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-8 text-center text-secondary-500">
                        No projects found
                      </div>
                    )}
                  </div>

                  {onCreateProject && (
                    <div className="p-3 border-t border-secondary-200">
                      <button
                        type="button"
                        onClick={onCreateProject}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        <Plus size={18} />
                        Create New Project
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              {errors.project_id && (
                <p className="mt-2 text-sm text-red-600">{errors.project_id.message}</p>
              )}
            </div>

            {selectedProject && (
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="font-medium text-blue-900 mb-2">{selectedProject.name}</p>
                {selectedProject.site_contact_name && (
                  <div className="flex items-center gap-2 text-sm text-blue-800 mt-1">
                    <User size={14} />
                    <span>{selectedProject.site_contact_name}</span>
                  </div>
                )}
                {selectedProject.site_contact_phone && (
                  <div className="flex items-center gap-2 text-sm text-blue-800 mt-1">
                    <Phone size={14} />
                    <span>{selectedProject.site_contact_phone}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 2: Delivery Details */}
          <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="text-primary-600" size={22} />
              <h3 className="font-bold text-secondary-900">Delivery Details</h3>
            </div>

            <div className="space-y-4">
              {/* PO Number */}
              <Input
                label="PO Number (Optional)"
                placeholder="Enter PO number if you have one"
                {...register('po_number')}
                error={errors.po_number?.message}
              />

              {/* Delivery Address */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Delivery Address *
                </label>
                {!isEditingAddress && watchDeliveryAddress ? (
                  <div className="flex items-start gap-2">
                    <div className="flex-1 px-4 py-3 bg-secondary-50 border border-secondary-200 rounded-lg">
                      <p className="text-sm text-secondary-900">{watchDeliveryAddress}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsEditingAddress(true)}
                      className="p-3 border border-secondary-300 rounded-lg hover:bg-secondary-50"
                      title="Edit address"
                    >
                      <Edit2 size={18} />
                    </button>
                    {selectedProject?.delivery_address && watchDeliveryAddress !== selectedProject.delivery_address && (
                      <button
                        type="button"
                        onClick={handleResetToProjectAddress}
                        className="p-3 border border-secondary-300 rounded-lg hover:bg-secondary-50"
                        title="Reset to project address"
                      >
                        <RotateCcw size={18} />
                      </button>
                    )}
                  </div>
                ) : (
                  <Autocomplete
                    key={addressKey}
                    apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
                    onPlaceSelected={handlePlaceSelected}
                    options={{
                      types: ['address'],
                      componentRestrictions: { country: 'au' },
                    }}
                    defaultValue={watchDeliveryAddress || ''}
                    className="w-full px-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Start typing to search address..."
                  />
                )}
                {errors.delivery_address && (
                  <p className="mt-2 text-sm text-red-600">{errors.delivery_address.message}</p>
                )}
                {errors.delivery_lat && (
                  <p className="mt-2 text-sm text-red-600">{errors.delivery_lat.message}</p>
                )}
                {errors.delivery_long && (
                  <p className="mt-2 text-sm text-red-600">{errors.delivery_long.message}</p>
                )}
                
                {/* Hidden inputs for lat/long */}
                <input type="hidden" {...register('delivery_lat')} />
                <input type="hidden" {...register('delivery_long')} />
              </div>

              {/* Date and Time */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Delivery Date */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Delivery Date *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" size={20} />
                    <input
                      type="date"
                      {...register('delivery_date')}
                      className="w-full pl-10 px-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  {errors.delivery_date && (
                    <p className="mt-2 text-sm text-red-600">{errors.delivery_date.message}</p>
                  )}
                </div>

                {/* Delivery Time */}
                {/* <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Delivery Time *
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" size={20} />
                    <input
                      type="time"
                      {...register('delivery_time')}
                      className="w-full pl-10 px-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  {errors.delivery_time && (
                    <p className="mt-2 text-sm text-red-600">{errors.delivery_time.message}</p>
                  )}
                </div> */}
              </div>

              {/* Load Size */}
              <Input
                label="Load Size *"
                placeholder="e.g., 6 cubic meters"
                {...register('load_size')}
                error={errors.load_size?.message}
              />

              {/* Special Equipment */}
              {/* <Input
                label="Special Equipment (Optional)"
                placeholder="Any special equipment required"
                {...register('special_equipment')}
                error={errors.special_equipment?.message}
              /> */}

              {/* Special Notes */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Special Notes (Optional)
                </label>
                <textarea
                  // {...register('special_notes')}
                  rows={3}
                  className="w-full px-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Any special instructions or notes..."
                />
                {/* {errors.special_notes && (
                  <p className="mt-2 text-sm text-red-600">{errors.special_notes.message}</p>
                )} */}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              type="button"
              onClick={onBack}
              variant="outline"
              className="flex-1"
            >
              ← Back
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || cartItems.length === 0}
              className="flex-1"
            >
              {isSubmitting ? 'Processing...' : 'Continue to Review →'}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default Step2_ProjectDelivery;