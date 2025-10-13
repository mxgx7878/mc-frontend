// FILE PATH: src/components/supplier/EditOfferModal.tsx
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, DollarSign, Package } from 'lucide-react';
import toast from 'react-hot-toast';

import { MasterProduct, SupplierOffer, supplierProductsAPI } from '../../api/handlers/supplierProducts.api';
import { updateOfferSchema, UpdateOfferFormData } from '../../utils/validators';
import Input2 from '../common/Input2'; // ✅ Using Input2 instead of Input
import Button from '../common/Buttons';

interface EditOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: MasterProduct | null;
  offer: SupplierOffer | null;
}

const EditOfferModal = ({ isOpen, onClose, product, offer }: EditOfferModalProps) => {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<UpdateOfferFormData>({
    resolver: zodResolver(updateOfferSchema),
  });

  // Pre-fill form when offer changes
  useEffect(() => {
    if (offer) {
      setValue('price', offer.price.toString()); // Convert number to string for input
      setValue('availability_status', offer.availability_status as any);
    }
  }, [offer, setValue]);

  const updateOfferMutation = useMutation({
    mutationFn: ({ offerId, payload }: { offerId: number; payload: any }) =>
      supplierProductsAPI.updateSupplierOffer(offerId, payload),
    onSuccess: () => {
      toast.success('Offer updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['supplier-products'] });
      handleClose();
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update offer';
      toast.error(message);
    },
  });

  const onSubmit = (data: UpdateOfferFormData) => {
    if (!offer) return;

    updateOfferMutation.mutate({
      offerId: offer.id,
      payload: {
        price: parseFloat(data.price),
        availability_status: data.availability_status,
      },
    });
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!isOpen || !product || !offer) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-secondary-100">
          <h2 className="text-2xl font-bold text-secondary-900">Edit Your Offer</h2>
          <button
            onClick={handleClose}
            className="text-secondary-400 hover:text-secondary-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Product Info */}
        <div className="p-6 bg-secondary-50 border-b border-secondary-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <Package size={24} className="text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-secondary-900">{product.product_name}</h3>
              <p className="text-sm text-secondary-600">
                {product.category.name} • {product.unit_of_measure}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Price Input - Using Input2 with icon as component */}
          <Input2
            label={`Price per ${product.unit_of_measure}`}
            type="text"
            placeholder="0.00"
            icon={DollarSign} // ✅ Pass component reference
            error={errors.price?.message}
            {...register('price')}
            required
          />

          {/* Availability Status */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Availability Status <span className="text-error-500">*</span>
            </label>
            <select
              {...register('availability_status')}
              className={`
                w-full px-4 py-3 rounded-lg border-2 transition-all
                ${errors.availability_status 
                  ? 'border-error-500 focus:border-error-500 focus:ring-error-500' 
                  : 'border-secondary-200 focus:border-primary-500 focus:ring-primary-500'
                }
                focus:outline-none focus:ring-2 focus:ring-opacity-20
              `}
            >
              <option value="In Stock">In Stock</option>
              <option value="Out of Stock">Out of Stock</option>
              <option value="Limited Stock">Limited Stock</option>
            </select>
            {errors.availability_status && (
              <p className="text-sm text-error-500 mt-1">{errors.availability_status.message}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              isLoading={updateOfferMutation.isPending}
              disabled={updateOfferMutation.isPending}
              fullWidth={false}
              className="flex-1"
            >
              {updateOfferMutation.isPending ? 'Updating...' : 'Update Offer'}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              fullWidth={false}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditOfferModal;