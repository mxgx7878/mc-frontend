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

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
  });

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
    
    // Auto-fill delivery address if available
    // Note: Projects don't have lat/long in the current schema
    // But when they do, this will auto-fill
    
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
                          : `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '/storage')}/${item.product_photo}`
                      }
                      alt={item.product_name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjZTVlN2ViIi8+PC9zdmc+';
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-secondary-900 truncate">
                      {item.product_name}
                    </p>
                    <p className="text-xs text-secondary-600">{item.product_type}</p>
                    <p className="text-xs text-primary-600 font-medium mt-1">
                      Qty: {item.quantity} {item.unit_of_measure}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Pricing Note */}
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-900 leading-relaxed">
                <span className="font-semibold">💡 Note:</span> Final pricing will be 
                calculated after order placement based on delivery location and availability. 
                You'll receive a detailed invoice within 20 minutes.
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

            {/* Project Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowProjectDropdown(!showProjectDropdown)}
                className={`w-full px-4 py-3 rounded-lg border-2 transition-colors text-left flex items-center justify-between ${
                  errors.project_id
                    ? 'border-red-300 bg-red-50'
                    : selectedProject
                    ? 'border-primary-300 bg-primary-50'
                    : 'border-secondary-300 hover:border-secondary-400'
                }`}
              >
                <span className={selectedProject ? 'text-secondary-900 font-medium' : 'text-secondary-500'}>
                  {selectedProject ? selectedProject.name : 'Select a project...'}
                </span>
                <ChevronDown
                  size={20}
                  className={`transition-transform ${showProjectDropdown ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Dropdown */}
              {showProjectDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-secondary-200 rounded-lg shadow-xl z-30 max-h-80 overflow-hidden">
                  {/* Search */}
                  <div className="p-3 border-b border-secondary-200">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" size={18} />
                      <input
                        type="text"
                        placeholder="Search projects..."
                        value={projectSearchTerm}
                        onChange={(e) => setProjectSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 rounded-lg border border-secondary-300 focus:border-primary-500 focus:outline-none text-sm"
                      />
                    </div>
                  </div>

                  {/* Project List */}
                  <div className="max-h-60 overflow-y-auto">
                    {filteredProjects.length === 0 ? (
                      <div className="p-4 text-center text-secondary-600 text-sm">
                        No projects found
                      </div>
                    ) : (
                      filteredProjects.map((project) => (
                        <button
                          key={project.id}
                          type="button"
                          onClick={() => handleProjectSelect(project)}
                          className="w-full text-left px-4 py-3 hover:bg-secondary-50 transition-colors border-b border-secondary-100 last:border-0"
                        >
                          <p className="font-semibold text-secondary-900">{project.name}</p>
                          {(project.site_contact_name || project.site_contact_phone) && (
                            <div className="mt-1 space-y-1">
                              {project.site_contact_name && (
                                <p className="text-xs text-secondary-600 flex items-center gap-1">
                                  <User size={12} />
                                  {project.site_contact_name}
                                </p>
                              )}
                              {project.site_contact_phone && (
                                <p className="text-xs text-secondary-600 flex items-center gap-1">
                                  <Phone size={12} />
                                  {project.site_contact_phone}
                                </p>
                              )}
                            </div>
                          )}
                        </button>
                      ))
                    )}
                  </div>

                  {/* Create New Project */}
                  {onCreateProject && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowProjectDropdown(false);
                        onCreateProject();
                      }}
                      className="w-full px-4 py-3 bg-primary-50 hover:bg-primary-100 transition-colors border-t-2 border-primary-200 text-primary-700 font-semibold text-sm flex items-center justify-center gap-2"
                    >
                      <Plus size={18} />
                      Create New Project
                    </button>
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
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Delivery Address <span className="text-red-500">*</span>
                </label>
                <Autocomplete
                  apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
                  onPlaceSelected={handlePlaceSelected}
                  options={{
                    types: ['address'],
                    componentRestrictions: { country: 'au' }, // Adjust country as needed
                  }}
                  placeholder="Start typing address..."
                  className="w-full px-4 py-3 rounded-lg border-2 border-secondary-200 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20"
                />
                {errors.delivery_address && (
                  <p className="text-sm text-red-600 mt-1">{errors.delivery_address.message}</p>
                )}
                {watchDeliveryLat && watchDeliveryLong && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    ✓ Location confirmed
                  </p>
                )}
              </div>

              {/* Date & Time Row */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    <Calendar size={16} className="inline mr-1" />
                    Delivery Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    {...register('delivery_date')}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 rounded-lg border-2 border-secondary-200 focus:border-primary-500 focus:outline-none"
                  />
                  {errors.delivery_date && (
                    <p className="text-sm text-red-600 mt-1">{errors.delivery_date.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    <Clock size={16} className="inline mr-1" />
                    Preferred Time (Optional)
                  </label>
                  <input
                    type="time"
                    {...register('delivery_time')}
                    className="w-full px-4 py-3 rounded-lg border-2 border-secondary-200 focus:border-primary-500 focus:outline-none"
                  />
                  {errors.delivery_time && (
                    <p className="text-sm text-red-600 mt-1">{errors.delivery_time.message}</p>
                  )}
                </div>
              </div>

              {/* Delivery Method */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  <Truck size={16} className="inline mr-1" />
                  Delivery Method <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {deliveryMethods.map((method) => (
                    <label
                      key={method}
                      className="relative flex items-center justify-center px-4 py-3 rounded-lg border-2 cursor-pointer transition-all hover:border-primary-300"
                    >
                      <input
                        type="radio"
                        value={method}
                        {...register('delivery_method')}
                        className="sr-only peer"
                      />
                      <span className="text-sm font-medium text-secondary-700 peer-checked:text-primary-700">
                        {method}
                      </span>
                      <div className="absolute inset-0 rounded-lg border-2 border-transparent peer-checked:border-primary-600 peer-checked:bg-primary-50 pointer-events-none" />
                    </label>
                  ))}
                </div>
                {errors.delivery_method && (
                  <p className="text-sm text-red-600 mt-1">{errors.delivery_method.message}</p>
                )}
              </div>

              {/* Load Size & Special Equipment */}
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label="Load Size (Optional)"
                  placeholder="e.g., 6m³"
                  {...register('load_size')}
                  error={errors.load_size?.message}
                />
                <Input
                  label="Special Equipment (Optional)"
                  placeholder="e.g., Extension chute"
                  {...register('special_equipment')}
                  error={errors.special_equipment?.message}
                />
              </div>

              {/* Special Notes */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Special Instructions (Optional)
                </label>
                <textarea
                  {...register('special_notes')}
                  rows={3}
                  placeholder="Any special instructions or notes..."
                  className="w-full px-4 py-3 rounded-lg border-2 border-secondary-200 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20"
                />
                {errors.special_notes && (
                  <p className="text-sm text-red-600 mt-1">{errors.special_notes.message}</p>
                )}
              </div>

              {/* Repeat Order Checkbox */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...register('repeat_order')}
                  id="repeat_order"
                  className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="repeat_order" className="text-sm text-secondary-700">
                  Mark as repeat order (for faster reordering in future)
                </label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onBack} fullWidth={false} className="px-8">
              ← Back
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              disabled={isSubmitting}
              fullWidth
              className="py-3 text-base font-semibold"
            >
              {isSubmitting ? 'Processing...' : 'Review Order →'}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default Step2_ProjectDelivery;