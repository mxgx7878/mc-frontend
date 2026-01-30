// FILE PATH: src/components/admin/Orders/AdminChangeSupplierModal.tsx

/**
 * Admin Change Supplier Modal
 * Allows admin to reassign supplier for an order item
 * Shows warning about impacts and requires confirmation
 */

import React, { useState } from 'react';
import {
  X,
  User,
  AlertTriangle,
  MapPin,
  DollarSign,
  CheckCircle,
  Loader2,
  TrendingUp,
} from 'lucide-react';
import type { AdminOrderItem } from '../../../types/adminOrder.types';
import { formatCurrency } from '../../../features/adminOrders/utils';
import { useAssignSupplier } from '../../../features/adminOrders/hooks';
import { usePermissions } from '../../../hooks/usePermissions';

interface AdminChangeSupplierModalProps {
  item: AdminOrderItem | null;
  orderId: number;
  isOpen: boolean;
  onClose: () => void;
}

const AdminChangeSupplierModal: React.FC<AdminChangeSupplierModalProps> = ({
  item,
  orderId,
  isOpen,
  onClose,
}) => {
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(null);
  const [selectedOfferId, setSelectedOfferId] = useState<number | null>(null);
  
  const { canViewCostPrice } = usePermissions();
  const assignSupplierMutation = useAssignSupplier();

  // Reset state when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setSelectedSupplierId(null);
      setSelectedOfferId(null);
    }
  }, [isOpen]);

  if (!isOpen || !item) return null;

  const currentSupplier = item.eligible_suppliers?.find((s) => s.selected);
  const otherSuppliers = item.eligible_suppliers?.filter((s) => !s.selected) || [];

  const handleSupplierSelect = (supplierId: number, offerId: number) => {
    setSelectedSupplierId(supplierId);
    setSelectedOfferId(offerId);
  };

  const handleConfirmChange = () => {
    if (!selectedSupplierId || !selectedOfferId) return;

    assignSupplierMutation.mutate(
      {
        order_id: orderId,
        item_id: item.id,
        supplier: selectedSupplierId,
        offer_id: selectedOfferId,
      },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  const isSupplierSelected = selectedSupplierId !== null && selectedOfferId !== null;
  const isChangingToSameSupplier = selectedSupplierId === currentSupplier?.supplier_id;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <User size={24} />
              Change Supplier
            </h3>
            <p className="text-blue-100 text-sm mt-1">
              Item #{item.id} - {item.product_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            disabled={assignSupplierMutation.isPending}
          >
            <X size={24} className="text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Warning Section */}
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
              <div className="flex-1">
                <h4 className="font-bold text-gray-900 mb-2">Warning: Changing supplier will:</h4>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-yellow-600 rounded-full"></div>
                    Reset supplier confirmation status
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-yellow-600 rounded-full"></div>
                    Clear quoted price overrides
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-yellow-600 rounded-full"></div>
                    Recalculate delivery costs
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-yellow-600 rounded-full"></div>
                    Preserve delivery schedules (may need reconfirmation)
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Current Supplier */}
          {currentSupplier && (
            <div>
              <h4 className="text-sm font-bold text-gray-600 uppercase mb-3 flex items-center gap-2">
                <CheckCircle size={16} className="text-green-600" />
                Current Supplier
              </h4>
              <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h5 className="font-bold text-gray-900 text-lg mb-2">
                      {currentSupplier.name}
                    </h5>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <MapPin size={14} className="text-green-600" />
                        <span className="font-medium">
                          {currentSupplier.distance?.toFixed(1)} km away
                        </span>
                      </div>
                      {canViewCostPrice && (
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <DollarSign size={14} className="text-green-600" />
                          <span className="font-medium">
                            {formatCurrency(currentSupplier.unit_cost as number)} per unit
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="px-3 py-1.5 bg-green-100 text-green-800 text-xs font-bold rounded-full border-2 border-green-300">
                    Currently Assigned
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Available Suppliers */}
          <div>
            <h4 className="text-sm font-bold text-gray-600 uppercase mb-3 flex items-center gap-2">
              <TrendingUp size={16} className="text-blue-600" />
              Available Suppliers
            </h4>
            {otherSuppliers.length === 0 ? (
              <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6 text-center">
                <AlertTriangle className="mx-auto text-gray-400 mb-2" size={32} />
                <p className="text-gray-600 font-medium">No other eligible suppliers available</p>
              </div>
            ) : (
              <div className="space-y-3">
                {otherSuppliers.map((supplier) => {
                  const isSelected =
                    selectedSupplierId === supplier.supplier_id &&
                    selectedOfferId === supplier.offer_id;

                  return (
                    <button
                      key={`${supplier.supplier_id}-${supplier.offer_id}`}
                      onClick={() =>
                        handleSupplierSelect(supplier.supplier_id, supplier.offer_id)
                      }
                      disabled={assignSupplierMutation.isPending}
                      className={`
                        w-full text-left p-4 rounded-xl border-2 transition-all
                        ${
                          isSelected
                            ? 'bg-blue-50 border-blue-500 shadow-md'
                            : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'
                        }
                        disabled:opacity-50 disabled:cursor-not-allowed
                      `}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div
                              className={`
                              w-5 h-5 rounded-full border-2 flex items-center justify-center
                              ${
                                isSelected
                                  ? 'bg-blue-600 border-blue-600'
                                  : 'bg-white border-gray-300'
                              }
                            `}
                            >
                              {isSelected && <CheckCircle size={12} className="text-white" />}
                            </div>
                            <h5 className="font-bold text-gray-900">{supplier.name}</h5>
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm ml-7">
                            <div className="flex items-center gap-1.5 text-gray-600">
                              <MapPin size={14} className="text-gray-500" />
                              <span className="font-medium">
                                {supplier.distance?.toFixed(1)} km away
                              </span>
                            </div>
                            {canViewCostPrice && (
                              <div className="flex items-center gap-1.5 text-gray-600">
                                <DollarSign size={14} className="text-gray-500" />
                                <span className="font-medium">
                                  {formatCurrency(supplier.unit_cost as number)} per unit
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        {isSelected && (
                          <span className="px-3 py-1.5 bg-blue-100 text-blue-800 text-xs font-bold rounded-full border-2 border-blue-300">
                            Selected
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t-2 border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={onClose}
              disabled={assignSupplierMutation.isPending}
              className="px-6 py-2.5 bg-white border-2 border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmChange}
              disabled={
                !isSupplierSelected ||
                isChangingToSameSupplier ||
                assignSupplierMutation.isPending ||
                otherSuppliers.length === 0
              }
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold rounded-lg hover:from-indigo-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg flex items-center gap-2"
            >
              {assignSupplierMutation.isPending ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Changing Supplier...
                </>
              ) : (
                <>
                  <CheckCircle size={18} />
                  Confirm Change Supplier
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminChangeSupplierModal;