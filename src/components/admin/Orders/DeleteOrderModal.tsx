// FILE PATH: src/components/admin/Orders/DeleteOrderModal.tsx

/**
 * Delete Order Modal Component
 * Confirms order archival (soft delete)
 */

import { X, AlertTriangle, Loader2 } from 'lucide-react';

interface DeleteOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  orderNumber: string;
}

const DeleteOrderModal = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  orderNumber,
}: DeleteOrderModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all">
          {/* Close Button */}
          <button
            onClick={onClose}
            disabled={isLoading}
            className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>

          {/* Content */}
          <div className="p-6">
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle size={32} className="text-red-600" />
              </div>
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
              Delete Order?
            </h3>

            {/* Description */}
            <p className="text-gray-600 text-center mb-2">
              Are you sure you want to delete order{' '}
              <span className="font-bold text-blue-600">{orderNumber}</span>?
            </p>
            <p className="text-sm text-gray-500 text-center mb-6">
              This order will be moved to archives and can be viewed in the Archives section.
            </p>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={isLoading}
                className="flex-1 px-4 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete Order'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteOrderModal;