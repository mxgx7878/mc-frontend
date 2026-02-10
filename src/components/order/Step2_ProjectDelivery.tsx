// FILE PATH: src/components/order/Step2_ProjectDelivery.tsx

/**
 * STEP 2: PROJECT & DELIVERY DETAILS
 * 
 * UPDATED:
 * - Added prefillProject and prefillLocation props
 * - When user selected a project in Step 1, both project + address auto-fill
 * - When user entered custom address in Step 1, only address auto-fills
 * 
 * USER FLOW:
 * 1. (Auto-filled from Step 1 if location was set)
 * 2. Select/confirm project
 * 3. Enter/edit delivery address
 * 4. Enter contact person details for this order
 * 5. Proceed to Step 3 (Split Delivery Scheduling)
 */

import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  MapPin,
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

  // NEW: Pre-fill from Step 1 location selection
  prefillProject?: Project | null;
  prefillLocation?: {
    address: string;
    lat: number;
    long: number;
  } | null;
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
  prefillProject,
  prefillLocation,
}) => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [projectSearchTerm, setProjectSearchTerm] = useState('');
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressKey, setAddressKey] = useState(0);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  // Track if we've already applied the prefill (prevent re-applying on re-renders)
  const hasPrefilled = useRef(false);

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
   * AUTO-PREFILL FROM STEP 1
   * 
   * WHAT: If user selected a location in Step 1, auto-fill Step 2 fields
   * 
   * CASES:
   * 1. prefillProject is set → auto-select that project + fill address from project
   * 2. prefillLocation is set (custom address) → fill only address fields
   * 3. Neither → normal behavior (auto-select if only 1 project)
   */
  useEffect(() => {
    if (hasPrefilled.current) return;

    // Case 1: Project was selected in Step 1
    if (prefillProject) {
      const matchedProject = projects.find((p) => p.id === prefillProject.id);
      if (matchedProject) {
        handleProjectSelect(matchedProject);
        hasPrefilled.current = true;
        return;
      }
    }

    // Case 2: Custom address was entered in Step 1
    if (prefillLocation) {
      setValue('delivery_address', prefillLocation.address, { shouldValidate: true });
      setValue('delivery_lat', prefillLocation.lat, { shouldValidate: true });
      setValue('delivery_long', prefillLocation.long, { shouldValidate: true });
      setIsEditingAddress(false);
      setAddressKey((prev) => prev + 1);
      hasPrefilled.current = true;
      return;
    }

    // Case 3: No prefill — auto-select if only one project exists
    if (projects.length === 1 && !selectedProject) {
      handleProjectSelect(projects[0]);
    }
  }, [projects, prefillProject, prefillLocation]);

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
      setAddressKey((prev) => prev + 1);
    }

    setShowProjectDropdown(false);
    setProjectSearchTerm('');
  };

  /**
   * Handle Google Autocomplete place selection
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
   */
  const handleMapPinConfirm = (address: string, lat: number, lng: number) => {
    setValue('delivery_address', address, { shouldValidate: true });
    setValue('delivery_lat', lat, { shouldValidate: true });
    setValue('delivery_long', lng, { shouldValidate: true });
    setIsEditingAddress(false);
    setIsMapModalOpen(false);
    setAddressKey((prev) => prev + 1);
  };

  /**
   * Reset address to project's default
   */
  const handleResetToProjectAddress = () => {
    if (
      selectedProject?.delivery_address &&
      selectedProject?.delivery_lat &&
      selectedProject?.delivery_long
    ) {
      setValue('delivery_address', selectedProject.delivery_address, { shouldValidate: true });
      setValue('delivery_lat', Number(selectedProject.delivery_lat), { shouldValidate: true });
      setValue('delivery_long', Number(selectedProject.delivery_long), { shouldValidate: true });
      setIsEditingAddress(false);
      setAddressKey((prev) => prev + 1);
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
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COLUMN: Cart Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6 sticky top-6">
              <h3 className="font-bold text-secondary-900 text-lg mb-4">🛒 Order Summary</h3>

              {/* Cart Items */}
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                {cartItems.map((item) => (
                  <div
                    key={item.product_id}
                    className="bg-secondary-50 rounded-lg p-3 space-y-2"
                  >
                    {/* Product Info Row */}
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-white border border-secondary-200 flex-shrink-0">
                        <img
                          src={getImageUrl(item.product_photo)}
                          alt={item.product_name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjZTVlN2ViIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMCIgZmlsbD0iIzljYTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-secondary-900 text-sm">
                          {item.product_name}
                        </p>
                        <p className="text-xs text-secondary-600 mt-1">{item.product_type}</p>
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
                          className="px-2 py-1 hover:bg-secondary-100 disabled:opacity-50"
                        >
                          <Minus size={14} />
                        </button>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(item.product_id, e.target.value)}
                          className="w-16 text-center py-1 text-sm border-x border-secondary-300 focus:outline-none"
                          min="1"
                        />
                        <button
                          type="button"
                          onClick={() => handleIncrement(item.product_id, item.quantity)}
                          className="px-2 py-1 hover:bg-secondary-100"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <span className="text-xs text-secondary-500">{item.unit_of_measure}</span>
                    </div>

                    {/* Custom Blend (for concrete/special products) */}
                    {item.product_type?.toLowerCase().includes('concrete') && onUpdateCustomBlend && (
                      <div className="mt-1">
                        <label className="text-xs text-secondary-600 font-medium">
                          Custom Blend Mix:
                        </label>
                        <input
                          type="text"
                          value={item.custom_blend_mix || ''}
                          onChange={(e) => onUpdateCustomBlend(item.product_id, e.target.value)}
                          placeholder="e.g. 32 MPA with 10mm aggregate"
                          className="w-full mt-1 px-2 py-1 text-xs border border-secondary-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
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
                      <span
                        className={
                          selectedProject ? 'text-secondary-900' : 'text-secondary-400'
                        }
                      >
                        {selectedProject ? selectedProject.name : 'Select a project'}
                      </span>
                      <ChevronDown
                        size={20}
                        className={`transition-transform ${
                          showProjectDropdown ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {/* Dropdown */}
                    {showProjectDropdown && (
                      <div className="absolute z-20 mt-1 w-full bg-white border border-secondary-200 rounded-lg shadow-lg max-h-60 overflow-hidden">
                        {/* Search */}
                        <div className="p-3 border-b border-secondary-100">
                          <div className="relative">
                            <Search
                              className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400"
                              size={16}
                            />
                            <input
                              type="text"
                              placeholder="Search projects..."
                              value={projectSearchTerm}
                              onChange={(e) => setProjectSearchTerm(e.target.value)}
                              className="w-full pl-9 pr-3 py-2 text-sm border border-secondary-200 rounded-lg focus:outline-none focus:border-primary-500"
                              autoFocus
                            />
                          </div>
                        </div>

                        {/* Project List */}
                        <div className="max-h-40 overflow-y-auto">
                          {filteredProjects.length > 0 ? (
                            filteredProjects.map((project) => (
                              <button
                                key={project.id}
                                type="button"
                                onClick={() => handleProjectSelect(project)}
                                className="w-full px-4 py-3 text-left hover:bg-primary-50 transition-colors flex items-center justify-between"
                              >
                                <span className="font-medium text-secondary-900">
                                  {project.name}
                                </span>
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
                              className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                            >
                              <Plus size={16} />
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

                {/* Selected Project Info */}
                {selectedProject && (
                  <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                    <p className="font-semibold text-primary-900">{selectedProject.name}</p>
                    {selectedProject.site_contact_name && (
                      <p className="text-sm text-primary-700 mt-1">
                        Contact: {selectedProject.site_contact_name}
                      </p>
                    )}
                    {selectedProject.site_instructions && (
                      <p className="text-sm text-primary-700 mt-1">
                        Instructions: {selectedProject.site_instructions}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Section 2: Delivery Address */}
            <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="text-primary-600" size={22} />
                <h3 className="font-bold text-secondary-900">Delivery Address</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Delivery Address *
                  </label>

                  {watchDeliveryAddress && !isEditingAddress ? (
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
                      {selectedProject?.delivery_address &&
                        watchDeliveryAddress !== selectedProject.delivery_address && (
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
                        placeholder="Start typing delivery address..."
                      />

                      {/* Pin on Map button */}
                      <button
                        type="button"
                        onClick={() => setIsMapModalOpen(true)}
                        className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                      >
                        <MapPin size={14} />
                        Pin location on map
                      </button>
                    </div>
                  )}

                  {errors.delivery_address && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {errors.delivery_address.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 3: Contact Person & PO Number */}
            <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <User className="text-primary-600" size={22} />
                <h3 className="font-bold text-secondary-900">Contact & Reference</h3>
              </div>

              <div className="space-y-4">
                {/* Contact Person Name */}
                <Input
                  label="Contact Person Name *"
                  placeholder="Who should be contacted at the delivery site?"
                  {...register('contact_person_name')}
                  error={errors.contact_person_name?.message}
                  icon={User}
                />

                {/* Contact Person Number */}
                <Input
                  label="Contact Person Number *"
                  placeholder="e.g., 0412 345 678"
                  {...register('contact_person_number')}
                  error={errors.contact_person_number?.message}
                  icon={Phone}
                />

                {/* PO Number */}
                <Input
                  label="PO Number (Optional)"
                  placeholder="e.g., PO-2024-001"
                  {...register('po_number')}
                  error={errors.po_number?.message}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button type="button" onClick={onBack} variant="outline" className="flex-1">
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