// FILE PATH: src/components/supplier/RequestProductModal.tsx
/**
 * REQUEST PRODUCT MODAL - FIXED VERSION
 * 
 * FIXES:
 * ✅ Price field now uses native input (not Input2 component)
 * ✅ Availability options match validation: "Limited" (not "Limited Stock")
 * ✅ Added debug console logs
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Package, Upload, FileText, Layers, DollarSign, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Category } from '../../api/handlers/supplierProducts.api';
import { supplierProductsAPI } from '../../api/handlers/supplierProducts.api';
import { requestProductSchema } from '../../utils/validators';
import type { RequestProductFormData } from '../../utils/validators';
import Input2 from '../common/Input2';
import Button from '../common/Buttons';

interface RequestProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
}

const RequestProductModal = ({ isOpen, onClose }: RequestProductModalProps) => {
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RequestProductFormData>({
    resolver: zodResolver(requestProductSchema),
    defaultValues: {
      availability_status: 'In Stock',
    },
  });

  const requestProductMutation = useMutation({
    mutationFn: supplierProductsAPI.requestMasterProduct,
    onSuccess: () => {
      toast.success('Product request submitted successfully!');
      queryClient.invalidateQueries({ queryKey: ['supplier-products'] });
      handleClose();
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to submit request';
      toast.error(message);
      console.error('Error:', error);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const onSubmit = (data: RequestProductFormData) => {
    console.log('📝 Form Data:', data);
    
    const payload = {
      product_name: data.product_name,
      product_type: data.product_type,
      specifications: data.specifications || '',
      unit_of_measure: data.unit_of_measure,
      price: data.price,
      availability_status: data.availability_status,
      photo: selectedFile || null,
    };

    console.log('🚀 Sending payload:', payload);
    requestProductMutation.mutate(payload);
  };

  const handleClose = () => {
    reset();
    setSelectedFile(null);
    setPreviewUrl(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-6 border-b-2 border-secondary-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <Package size={24} className="text-primary-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-secondary-900">Request New Product</h2>
              <p className="text-sm text-secondary-600">Submit for admin approval</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={requestProductMutation.isPending}
            className="text-secondary-400 hover:text-secondary-600 hover:bg-secondary-100 rounded-lg p-2 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          
          {/* Product Name */}
          <Input2
            label="Product Name"
            type="text"
            placeholder="e.g., Premium Blue Metal"
            icon={Package}
            error={errors.product_name?.message}
            {...register('product_name')}
            required
          />

          {/* Product Type */}
          <Input2
            label="Product Type"
            type="text"
            placeholder="e.g., Construction Material"
            icon={Layers}
            error={errors.product_type?.message}
            {...register('product_type')}
            required
          />

          {/* Category */}
          {/* <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Category <span className="text-error-500">*</span>
            </label>
            <div className="relative">
              <Layers className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" size={20} />
              <select
                {...register('category_id', { valueAsNumber: true })}
                className={`
                  w-full pl-11 pr-4 py-3 rounded-lg border-2 transition-all
                  ${errors.category_id 
                    ? 'border-error-500 focus:border-error-500 focus:ring-error-500' 
                    : 'border-secondary-200 focus:border-primary-500 focus:ring-primary-500'
                  }
                  focus:outline-none focus:ring-2 focus:ring-opacity-20
                `}
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            {errors.category_id && (
              <p className="text-sm text-error-500 mt-1">{errors.category_id.message}</p>
            )}
          </div> */}

          {/* Unit of Measure */}
          <Input2
            label="Unit of Measure"
            type="text"
            placeholder="e.g., ton, kg, cubic meter"
            icon={Layers}
            error={errors.unit_of_measure?.message}
            {...register('unit_of_measure')}
            required
          />

          {/* Price - FIXED: Using native input */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Price per Unit <span className="text-error-500">*</span>
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" size={20} />
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...register('price')}
                className={`
                  w-full pl-11 pr-4 py-3 rounded-lg border-2 transition-all
                  ${errors.price 
                    ? 'border-error-500 focus:border-error-500 focus:ring-error-500' 
                    : 'border-secondary-200 focus:border-primary-500 focus:ring-primary-500'
                  }
                  focus:outline-none focus:ring-2 focus:ring-opacity-20
                `}
              />
            </div>
            {errors.price && (
              <p className="text-sm text-error-500 mt-1">{errors.price.message}</p>
            )}
          </div>

          {/* Availability Status - FIXED: Options match validation */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Availability Status <span className="text-error-500">*</span>
            </label>
            <div className="relative">
              <CheckCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" size={20} />
              <select
                {...register('availability_status')}
                className={`
                  w-full pl-11 pr-4 py-3 rounded-lg border-2 transition-all
                  ${errors.availability_status 
                    ? 'border-error-500 focus:border-error-500 focus:ring-error-500' 
                    : 'border-secondary-200 focus:border-primary-500 focus:ring-primary-500'
                  }
                  focus:outline-none focus:ring-2 focus:ring-opacity-20
                `}
              >
                <option value="In Stock">In Stock</option>
                <option value="Out of Stock">Out of Stock</option>
                <option value="Limited">Limited</option>
              </select>
            </div>
            {errors.availability_status && (
              <p className="text-sm text-error-500 mt-1">{errors.availability_status.message}</p>
            )}
          </div>

          {/* Specifications */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Specifications
            </label>
            <textarea
              {...register('specifications')}
              rows={4}
              placeholder="Product specifications..."
              className={`
                w-full px-4 py-3 rounded-lg border-2 transition-all resize-none
                ${errors.specifications 
                  ? 'border-error-500 focus:border-error-500' 
                  : 'border-secondary-200 focus:border-primary-500'
                }
                focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20
              `}
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Product Image (Optional)
            </label>
            
            {previewUrl ? (
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg border-2 border-secondary-200"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 shadow-lg"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-secondary-300 rounded-lg cursor-pointer bg-secondary-50 hover:bg-secondary-100">
                <Upload size={32} className="text-secondary-400 mb-2" />
                <span className="text-sm text-secondary-600">Click to upload</span>
                <span className="text-xs text-secondary-500 mt-1">PNG, JPG up to 5MB</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <FileText className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-sm text-blue-700">
                Once approved, this product will be added to the master inventory.
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t-2 border-secondary-100">
            <Button
              type="button"
              onClick={handleClose}
              variant="outline"
              fullWidth
              disabled={requestProductMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={requestProductMutation.isPending}
              isLoading={requestProductMutation.isPending}
            >
              {requestProductMutation.isPending ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RequestProductModal;