// FILE PATH: src/components/order/Step2_ProjectDelivery.tsx

/**
 * STEP 2: PROJECT & DELIVERY DETAILS
 * 
 * UPDATED CHANGES:
 * - REMOVED: delivery_time, special_equipment, special_notes
 * - ADDED: contact_person_name, contact_person_number
 * - KEPT: delivery_date (as primary/default delivery date)
 * 
 * WHY THESE CHANGES:
 * - Delivery time is now per-slot (configured in Step 3)
 * - Contact person is order-specific (not project-specific)
 * - Special equipment/notes removed per requirements
 * 
 * USER FLOW:
 * 1. Select project (auto-fills address)
 * 2. Enter/edit delivery address
 * 3. Set primary delivery date (default for all slots)
 * 4. Enter contact person details for this order
 * 5. Proceed to Step 3 (Split Delivery Scheduling)
 */

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  MapPin,
  Calendar,
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
import MapPinModal from './MapPinModal';

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
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

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

  /**
   * Get image URL with fallback for product photos
   * 
   * WHY: Product photos might be null or invalid URLs
   * WHAT: Returns a base64 SVG placeholder if photo is missing
   */
  const getImageUrl = (photo: string | null | undefined): string => {
    if (!photo) {
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjZTVlN2ViIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMCIgZmlsbD0iIzljYTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
    }

    return photo.startsWith('http')
      ? photo
      : `${import.meta.env.VITE_IMAGE_BASE_URL}storage/${photo}`;
  };

  /**
   * Auto-select project if only one exists
   * 
   * WHY: Better UX - skip dropdown if there's only one option
   */
  useEffect(() => {
    if (projects.length === 1 && !selectedProject) {
      handleProjectSelect(projects[0]);
    }
  }, [projects]);

  /**
   * Handle project selection
   * 
   * WHAT: Sets project and auto-fills delivery address from project data
   * WHY: Projects have default delivery locations saved
   * HOW: Updates form values with project's delivery_address, lat, lng
   */
  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
    setValue('project_id', project.id, { shouldValidate: true });
    
    // Auto-fill address if project has one
    if (project.delivery_address && project.delivery_lat && project.delivery_long) {
      setValue('delivery_address', project.delivery_address, { shouldValidate: true });
      setValue('delivery_lat', Number(project.delivery_lat), { shouldValidate: true });
      setValue('delivery_long', Number(project.delivery_long), { shouldValidate: true });
      setIsEditingAddress(false);
      setAddressKey(prev => prev + 1); // Force re-render of autocomplete
    }
    
    setShowProjectDropdown(false);
    setProjectSearchTerm('');
  };

  /**
   * Handle Google Autocomplete place selection
   * 
   * WHAT: Extracts address string and coordinates from Google Place object
   * WHY: Primary method for address input with automatic geocoding
   * HOW: Uses Google's formatted_address and geometry.location
   */
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

  /**
   * Handle map pin confirmation
   * 
   * WHAT: Receives address + coordinates from MapPinModal component
   * WHY: Alternative address input method when autocomplete doesn't work
   * HOW: User pins location on interactive map, modal performs reverse geocoding
   * FLOW:
   * 1. User clicks "Pin on Map"
   * 2. Modal opens with Google Map
   * 3. User clicks to pin location
   * 4. Modal fetches address via reverse geocoding
   * 5. User confirms
   * 6. This function updates form values
   */
  const handleMapPinConfirm = (address: string, lat: number, lng: number) => {
    setValue('delivery_address', address, { shouldValidate: true });
    setValue('delivery_lat', lat, { shouldValidate: true });
    setValue('delivery_long', lng, { shouldValidate: true });
    setIsEditingAddress(false);
    setIsMapModalOpen(false);
    setAddressKey(prev => prev + 1);
  };

  /**
   * Reset address to project's default
   * 
   * WHAT: Restores project's saved delivery address
   * WHY: User might want to undo manual address changes
   */
  const handleResetToProjectAddress = () => {
    if (selectedProject?.delivery_address && selectedProject?.delivery_lat && selectedProject?.delivery_long) {
      setValue('delivery_address', selectedProject.delivery_address, { shouldValidate: true });
      setValue('delivery_lat', Number(selectedProject.delivery_lat), { shouldValidate: true });
      setValue('delivery_long', Number(selectedProject.delivery_long), { shouldValidate: true });
      setIsEditingAddress(false);
      setAddressKey(prev => prev + 1);
    }
  };

  /**
   * Filter projects by search term
   */
  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(projectSearchTerm.toLowerCase())
  );

  /**
   * Handle quantity changes for cart items
   * 
   * WHY: User might realize they need more/less of a product
   * WHAT: Updates cart item quantity (also scales delivery slots proportionally)
   */
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
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* LEFT COLUMN: Order Summary (Editable) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-5 lg:sticky lg:top-6">
              <h3 className="font-bold text-secondary-900 mb-4 flex items-center gap-2">
                <Building2 size={20} className="text-primary-600" />
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
                        className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                        title="Remove item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-secondary-600 font-medium">Quantity:</label>
                      <div className="flex items-center border border-secondary-300 rounded-lg overflow-hidden">
                        <button
                          type="button"
                          onClick={() => handleDecrement(item.product_id, item.quantity)}
                          disabled={item.quantity <= 1}
                          className="px-2 py-1 bg-secondary-50 hover:bg-secondary-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <Minus size={14} />
                        </button>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(item.product_id, e.target.value)}
                          className="w-12 text-center text-sm font-medium border-x border-secondary-300 py-1 focus:outline-none"
                          min="1"
                        />
                        <button
                          type="button"
                          onClick={() => handleIncrement(item.product_id, item.quantity)}
                          className="px-2 py-1 bg-secondary-50 hover:bg-secondary-100 transition-colors"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Custom Blend (if applicable) */}
                    {item.custom_blend_mix !== null && onUpdateCustomBlend && (
                      <div className="mt-2">
                        <label className="text-xs text-secondary-600 font-medium mb-1 block">
                          Custom Blend:
                        </label>
                        <input
                          type="text"
                          value={item.custom_blend_mix || ''}
                          onChange={(e) => onUpdateCustomBlend(item.product_id, e.target.value)}
                          placeholder="Enter custom blend details"
                          className="w-full text-xs px-2 py-1 border border-secondary-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Total Items */}
              <div className="mt-4 pt-4 border-t border-secondary-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-secondary-900">Total Items:</span>
                  <span className="text-lg font-bold text-primary-600">{totalItems}</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Project & Delivery Details */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Section 1: Project Selection */}
            <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="text-primary-600" size={22} />
                <h3 className="font-bold text-secondary-900">Select Project</h3>
              </div>

              <div className="space-y-4">
                {/* Project Selector */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Project *
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowProjectDropdown(!showProjectDropdown)}
                      className={`w-full px-4 py-3 border rounded-lg flex items-center justify-between transition-colors ${
                        errors.project_id
                          ? 'border-red-500 bg-red-50'
                          : 'border-secondary-300 hover:border-primary-500'
                      }`}
                    >
                      <span className={selectedProject ? 'text-secondary-900' : 'text-secondary-400'}>
                        {selectedProject ? selectedProject.name : 'Select a project'}
                      </span>
                      <ChevronDown
                        size={20}
                        className={`transition-transform ${showProjectDropdown ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {/* Dropdown */}
                    {showProjectDropdown && (
                      <div className="absolute z-10 mt-2 w-full bg-white border border-secondary-200 rounded-lg shadow-lg max-h-72 overflow-auto">
                        {/* Search */}
                        <div className="p-3 border-b border-secondary-100 sticky top-0 bg-white">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" size={18} />
                            <input
                              type="text"
                              value={projectSearchTerm}
                              onChange={(e) => setProjectSearchTerm(e.target.value)}
                              placeholder="Search projects..."
                              className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                          </div>
                        </div>

                        {/* Projects List */}
                        <div className="py-2">
                          {filteredProjects.length > 0 ? (
                            filteredProjects.map((project) => (
                              <button
                                key={project.id}
                                type="button"
                                onClick={() => handleProjectSelect(project)}
                                className="w-full px-4 py-3 text-left hover:bg-primary-50 transition-colors flex items-center justify-between"
                              >
                                <span className="font-medium text-secondary-900">{project.name}</span>
                                {selectedProject?.id === project.id && (
                                  <div className="w-2 h-2 bg-primary-600 rounded-full" />
                                )}
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-6 text-center text-secondary-500 text-sm">
                              No projects found
                            </div>
                          )}
                        </div>

                        {/* Create New Project */}
                        {onCreateProject && (
                          <div className="p-3 border-t border-secondary-100">
                            <button
                              type="button"
                              onClick={() => {
                                setShowProjectDropdown(false);
                                onCreateProject();
                              }}
                              className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                            >
                              <Plus size={18} />
                              Create New Project
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {errors.project_id && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {errors.project_id.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Project Info Display */}
              {selectedProject && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-900 mb-2">
                    {selectedProject.name}
                  </p>
                  {selectedProject.site_contact_name && (
                    <div className="flex items-center gap-2 text-sm text-blue-800">
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
                {/* Contact Person Name */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Contact Person Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" size={20} />
                    <input
                      type="text"
                      {...register('contact_person_name')}
                      placeholder="Name of person receiving delivery"
                      className="w-full pl-10 px-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  {errors.contact_person_name && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {errors.contact_person_name.message}
                    </p>
                  )}
                </div>

                {/* Contact Person Number */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Contact Person Number *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" size={20} />
                    <input
                      type="tel"
                      {...register('contact_person_number')}
                      placeholder="Phone number for delivery coordination"
                      className="w-full pl-10 px-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  {errors.contact_person_number && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {errors.contact_person_number.message}
                    </p>
                  )}
                </div>
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
                        className="p-3 border border-secondary-300 rounded-lg hover:bg-secondary-50 transition-colors"
                        title="Edit address"
                      >
                        <Edit2 size={18} />
                      </button>
                      {selectedProject?.delivery_address && watchDeliveryAddress !== selectedProject.delivery_address && (
                        <button
                          type="button"
                          onClick={handleResetToProjectAddress}
                          className="p-3 border border-secondary-300 rounded-lg hover:bg-secondary-50 transition-colors"
                          title="Reset to project address"
                        >
                          <RotateCcw size={18} />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Autocomplete Input */}
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
                      
                      {/* OR Divider */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-px bg-secondary-200" />
                        <span className="text-xs text-secondary-500 font-medium">OR</span>
                        <div className="flex-1 h-px bg-secondary-200" />
                      </div>
                      
                      {/* Pin on Map Button */}
                      <button
                        type="button"
                        onClick={() => setIsMapModalOpen(true)}
                        className="w-full px-4 py-3 border-2 border-primary-500 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors flex items-center justify-center gap-2 font-medium"
                      >
                        <MapPin size={18} />
                        Pin Location on Map
                      </button>
                    </div>
                  )}
                  {errors.delivery_address && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {errors.delivery_address.message}
                    </p>
                  )}
                  {errors.delivery_lat && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {errors.delivery_lat.message}
                    </p>
                  )}
                  
                  {/* Hidden inputs for lat/long */}
                  <input type="hidden" {...register('delivery_lat')} />
                  <input type="hidden" {...register('delivery_long')} />
                </div>

                {/* Primary Delivery Date */}
                {/* <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Primary Delivery Date *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" size={20} />
                    <input
                      type="date"
                      {...register('delivery_date')}
                      className="w-full pl-10 px-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <p className="mt-1 text-xs text-secondary-500">
                    This will be used as the default date for delivery scheduling (configurable in next step)
                  </p>
                  {errors.delivery_date && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {errors.delivery_date.message}
                    </p>
                  )}
                </div> */}

                {/* Load Size */}
                {/* <Input
                  label="Load Size (Optional)"
                  placeholder="e.g., 6 cubic meters"
                  {...register('load_size')}
                  error={errors.load_size?.message}
                /> */}

                
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
                {isSubmitting ? 'Processing...' : 'Continue to Schedule Deliveries →'}
              </Button>
            </div>
          </div>
        </div>
      </form>

      {/* MapPinModal Component */}
      <MapPinModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        onConfirm={handleMapPinConfirm}
        initialLat={watchDeliveryLat}
        initialLng={watchDeliveryLong}
        initialAddress={watchDeliveryAddress}
      />
    </>
  );
};

export default Step2_ProjectDelivery;