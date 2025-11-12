// src/components/order/Step2_ProjectDelivery.tsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  MapPin,
  Calendar,
  Clock,
  Truck,
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
}

const Step2_ProjectDelivery: React.FC<Step2Props> = ({
  cartItems,
  projects,
  onSubmit,
  onBack,
  isSubmitting,
  onCreateProject,
}) => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [projectSearchTerm, setProjectSearchTerm] = useState('');
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressKey, setAddressKey] = useState(0); // For forcing Autocomplete re-render

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
  const watchDeliveryLat = watch('delivery_lat');
  const watchDeliveryLong = watch('delivery_long');

  // Auto-select if only one project
  useEffect(() => {
    if (projects.length === 1 && !selectedProject) {
      handleProjectSelect(projects[0]);
    }
  }, [projects]);

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
    setValue('project_id', project.id, { shouldValidate: true });
    
    // Auto-fill delivery address from project
    if (project.delivery_address && project.delivery_lat && project.delivery_long) {
      setValue('delivery_address', project.delivery_address, { shouldValidate: true });
      setValue('delivery_lat', project.delivery_lat, { shouldValidate: true });
      setValue('delivery_long', project.delivery_long, { shouldValidate: true });
      setIsEditingAddress(false);
      setAddressKey(prev => prev + 1); // Force Autocomplete to update
    }
    
    setShowProjectDropdown(false);
    setProjectSearchTerm('');
  };

  const handlePlaceSelected = (place: any) => {
    if (place.formatted_address) {
      setValue('delivery_address', place.formatted_address, { shouldValidate: true });
    }
    if (place.geometry?.location) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      setValue('delivery_lat', lat, { shouldValidate: true });
      setValue('delivery_long', lng, { shouldValidate: true });
    }
  };

  const handleResetToProjectAddress = () => {
    if (selectedProject?.delivery_address && selectedProject?.delivery_lat && selectedProject?.delivery_long) {
      setValue('delivery_address', selectedProject.delivery_address, { shouldValidate: true });
      setValue('delivery_lat', selectedProject.delivery_lat, { shouldValidate: true });
      setValue('delivery_long', selectedProject.delivery_long, { shouldValidate: true });
      setIsEditingAddress(false);
      setAddressKey(prev => prev + 1); // Force Autocomplete to update
    }
  };

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(projectSearchTerm.toLowerCase())
  );

  // Get delivery methods from schema
  const deliveryMethods = ['Other', 'Tipper', 'Agitator', 'Pump', 'Ute'];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* LEFT: Order Summary (Sticky on desktop) */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-5 lg:sticky lg:top-6">
            <h3 className="font-bold text-secondary-900 mb-4 flex items-center gap-2">
              <FileText size={20} className="text-primary-600" />
              Order Summary
            </h3>

            <div className="space-y-3">
              {cartItems.map((item) => (
                <div
                  key={item.product_id}
                  className="flex items-start gap-3 pb-3 border-b border-secondary-100 last:border-0"
                >
                  <div className="w-12 h-12 rounded-lg bg-secondary-100 flex-shrink-0 overflow-hidden">
                    <img
                      src={
                        item.product_photo.startsWith('http')
                          ? item.product_photo
                          : `${import.meta.env.VITE_IMAGE_BASE_URL}${item.product_photo}`
                      }
                      alt={item.product_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-secondary-900 text-sm truncate">
                      {item.product_name}
                    </p>
                    <p className="text-xs text-secondary-600 mt-1">
                      Qty: {item.quantity} {item.unit_of_measure}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-secondary-200">
              <p className="text-sm text-secondary-600">
                Total Items: <span className="font-bold text-secondary-900">{cartItems.length}</span>
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT: Form Fields */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Project Selection */}
          <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
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
                <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {errors.project_id.message}
                </p>
              )}
            </div>

            {/* Selected Project Info */}
            {selectedProject && (
              <div className="mt-4 bg-primary-50 border border-primary-200 rounded-lg p-4">
                <p className="font-semibold text-primary-900 mb-2">✓ Project Selected</p>
                {selectedProject.site_contact_name && (
                  <p className="text-sm text-primary-700 flex items-center gap-2">
                    <User size={14} />
                    {selectedProject.site_contact_name}
                  </p>
                )}
                {selectedProject.site_contact_phone && (
                  <p className="text-sm text-primary-700 flex items-center gap-2 mt-1">
                    <Phone size={14} />
                    {selectedProject.site_contact_phone}
                  </p>
                )}
                {selectedProject.site_instructions && (
                  <p className="text-sm text-primary-700 mt-2">
                    <span className="font-medium">Instructions:</span> {selectedProject.site_instructions}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Section 2: Delivery Details */}
          <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="text-primary-600" size={22} />
              <h3 className="font-bold text-secondary-900">Delivery Information</h3>
            </div>

            <div className="space-y-4">
              {/* PO Number (Optional) */}
              <Input
                label="PO Number (Optional)"
                placeholder="e.g., PO-2025-001"
                {...register('po_number')}
                error={errors.po_number?.message}
              />

              {/* Delivery Address with Google Autocomplete */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-secondary-700">
                    Delivery Address
                  </label>
                  {selectedProject?.delivery_address && !isEditingAddress && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingAddress(true);
                        setAddressKey(prev => prev + 1);
                      }}
                      className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700"
                    >
                      <Edit2 size={12} />
                      Change Address
                    </button>
                  )}
                  {selectedProject?.delivery_address && isEditingAddress && (
                    <button
                      type="button"
                      onClick={handleResetToProjectAddress}
                      className="flex items-center gap-1 text-xs text-secondary-600 hover:text-secondary-700"
                    >
                      <RotateCcw size={12} />
                      Reset to Project Address
                    </button>
                  )}
                </div>

                {!isEditingAddress && watchDeliveryAddress && selectedProject?.delivery_address && 
                 watchDeliveryAddress === selectedProject.delivery_address ? (
                  // Show static address when not editing and it matches project address
                  <div className="w-full px-4 py-3 bg-secondary-50 border border-secondary-300 rounded-lg">
                    <p className="text-secondary-900">{watchDeliveryAddress}</p>
                    {watchDeliveryLat && watchDeliveryLong && (
                      <p className="text-xs text-secondary-600 mt-1">
                        📍 {watchDeliveryLat.toFixed(6)}, {watchDeliveryLong.toFixed(6)}
                      </p>
                    )}
                  </div>
                ) : (
                  // Show Google Autocomplete when editing or no project address
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
                    placeholder="Start typing delivery address..."
                  />
                )}

                {errors.delivery_address && (
                  <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.delivery_address.message}
                  </p>
                )}

                {/* Show coordinates if available */}
                {isEditingAddress && watchDeliveryLat && watchDeliveryLong && (
                  <p className="text-xs text-secondary-600 mt-1">
                    📍 Location: {watchDeliveryLat.toFixed(6)}, {watchDeliveryLong.toFixed(6)}
                  </p>
                )}
              </div>

              {/* Hidden fields for lat/long */}
              <input type="hidden" {...register('delivery_lat', { valueAsNumber: true })} />
              <input type="hidden" {...register('delivery_long', { valueAsNumber: true })} />

              {/* Delivery Date */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1 flex items-center gap-2">
                  <Calendar size={16} className="text-primary-600" />
                  Delivery Date
                </label>
                <input
                  type="date"
                  {...register('delivery_date')}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                {errors.delivery_date && (
                  <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.delivery_date.message}
                  </p>
                )}
              </div>

              {/* Delivery Time (Optional) */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1 flex items-center gap-2">
                  <Clock size={16} className="text-primary-600" />
                  Delivery Time (Optional)
                </label>
                <input
                  type="time"
                  {...register('delivery_time')}
                  className="w-full px-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Delivery Method */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1 flex items-center gap-2">
                  <Truck size={16} className="text-primary-600" />
                  Delivery Method
                </label>
                <select
                  {...register('delivery_method')}
                  className="w-full px-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {deliveryMethods.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
                {errors.delivery_method && (
                  <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.delivery_method.message}
                  </p>
                )}
              </div>

              {/* Load Size (Optional) */}
              <Input
                label="Load Size (Optional)"
                placeholder="e.g., 6m³"
                {...register('load_size')}
                error={errors.load_size?.message}
              />

              {/* Special Equipment (Optional) */}
              <Input
                label="Special Equipment (Optional)"
                placeholder="e.g., Pump required"
                {...register('special_equipment')}
                error={errors.special_equipment?.message}
              />

              {/* Special Notes (Optional) */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Special Notes (Optional)
                </label>
                <textarea
                  {...register('special_notes')}
                  rows={4}
                  placeholder="Any additional instructions or notes..."
                  className="w-full px-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                />
                {errors.special_notes && (
                  <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.special_notes.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>
              ← Back to Products
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Processing...' : 'Review Order →'}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default Step2_ProjectDelivery;