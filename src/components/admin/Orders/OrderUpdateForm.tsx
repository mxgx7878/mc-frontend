// FILE PATH: src/components/admin/Orders/OrderUpdateForm.tsx

/**
 * Order Update Form Component
 * Allows admin to update order details
 */

import React, { useState } from 'react';
import { Save, X } from 'lucide-react';
import type { AdminOrderDetail } from '../../../types/adminOrder.types';
import { useUpdateAdminOrder } from '../../../features/adminOrders/hooks';
import { canEditOrder } from '../../../features/adminOrders/utils';

interface OrderUpdateFormProps {
  order: AdminOrderDetail;
}

const OrderUpdateForm: React.FC<OrderUpdateFormProps> = ({ order }) => {
  const updateMutation = useUpdateAdminOrder();
  const canEdit = canEditOrder(order.workflow);

  // Helper function to format date for input[type="date"]
  const formatDateForInput = (dateString: string): string => {
    if (!dateString) return '';
    // Extract just the date part (yyyy-MM-dd) from ISO string
    return dateString.split('T')[0];
  };

  const [formData, setFormData] = useState({
    project_id: order.filters.projects.find((p) => p.name === order.project)?.id || 0,
    delivery_date: formatDateForInput(order.delivery_date),
    delivery_method: order.delivery_method || 'Other',
    special_notes: order.special_notes || '',
    discount: order.discount,
  });

  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Build payload with only changed fields
    const payload: any = {};

    if (formData.project_id !== order.filters.projects.find((p) => p.name === order.project)?.id) {
      payload.project_id = formData.project_id;
    }
    if (formData.delivery_date !== order.delivery_date) {
      payload.delivery_date = formData.delivery_date;
    }
    if (formData.delivery_method !== order.delivery_method) {
      payload.delivery_method = formData.delivery_method;
    }
    if (formData.special_notes !== (order.special_notes || '')) {
      payload.special_notes = formData.special_notes;
    }
    if (formData.discount !== order.discount) {
      payload.discount = formData.discount;
    }

    if (Object.keys(payload).length === 0) {
      return;
    }

    updateMutation.mutate(
      { orderId: order.id, payload },
      {
        onSuccess: () => {
          setHasChanges(false);
        },
      }
    );
  };

  const handleReset = () => {
    setFormData({
      project_id: order.filters.projects.find((p) => p.name === order.project)?.id || 0,
      delivery_date: order.delivery_date,
      delivery_method: order.delivery_method || 'Other',
      special_notes: order.special_notes || '',
      discount: order.discount,
    });
    setHasChanges(false);
  };

  if (!canEdit) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Update Order</h2>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-gray-700 font-medium">Order Cannot Be Edited</p>
          <p className="text-sm text-gray-600 mt-1">
            Delivered orders are locked and cannot be modified.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Update Order</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Project */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
          <select
            value={formData.project_id}
            onChange={(e) => handleChange('project_id', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={0}>Select project...</option>
            {order.filters.projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        {/* Delivery Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Date</label>
          <input
            type="date"
            value={formData.delivery_date}
            onChange={(e) => handleChange('delivery_date', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Delivery Method */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Method</label>
          <select
            value={formData.delivery_method}
            onChange={(e) => handleChange('delivery_method', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="Other">Other</option>
            <option value="Tipper">Tipper</option>
            <option value="Agitator">Agitator</option>
            <option value="Pump">Pump</option>
            <option value="Ute">Ute</option>
          </select>
        </div>

        {/* Special Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Special Notes</label>
          <textarea
            value={formData.special_notes}
            onChange={(e) => handleChange('special_notes', e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="Add any special instructions..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            {formData.special_notes.length}/1000 characters
          </p>
        </div>

        {/* Discount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Discount ($)</label>
          <input
            type="number"
            value={formData.discount}
            onChange={(e) => handleChange('discount', parseFloat(e.target.value) || 0)}
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={!hasChanges || updateMutation.isPending}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save size={18} />
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={!hasChanges}
            className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <X size={18} />
            Reset
          </button>
        </div>
      </form>
    </div>
  );
};

export default OrderUpdateForm;