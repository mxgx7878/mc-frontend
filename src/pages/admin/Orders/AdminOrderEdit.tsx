// src/pages/admin/Orders/AdminOrderEdit.tsx
/**
 * ADMIN ORDER EDIT PAGE
 *
 * Same capabilities as ClientOrderEdit:
 * - Contact Information editing
 * - Items Management (edit qty, deliveries, remove, add new)
 *
 * Differences:
 * - Uses admin hooks & layout
 * - Hits POST /admin/orders/{order}/edit (with ActionLog)
 * - Maps AdminOrderItem → OrderEditItem for reusable components
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  User,
  Phone,
  FileText,
  Package,
  AlertCircle,
  CheckCircle,
  Loader2,
  Info,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { getMenuItemsByRole } from '../../../utils/menuItems';
import { useAdminOrderDetail } from '../../../features/adminOrders/hooks';
import { useAdminEditOrder } from '../../../features/adminOrders/hooks';
import EditOrderItems from '../../../components/client/orderEdit/EditOrderItems';
import EditItemModal from '../../../components/client/orderEdit/EditItemModal';
import AddItemModal from '../../../components/client/orderEdit/AddItemModal';
import { useAuthStore } from '../../../store/authStore';
import type {
  ContactInfoFormState,
  OrderEditItem,
  EditOrderPayload,
  EditDeliveryPayload,
  AddItemPayload,
} from '../../../types/orderEdit.types';
import type { AdminOrderItem } from '../../../types/adminOrder.types';

// ==================== HELPERS ====================

/** Map AdminOrderItem → OrderEditItem so reusable components work */
const mapAdminItemToEditItem = (item: AdminOrderItem): OrderEditItem => ({
  id: item.id,
  order_id: 0, // not used by edit components
  product_id: item.product_id,
  quantity: item.quantity,
  supplier_id: item.supplier?.id ?? item.supplier_id ?? null,
  supplier_unit_cost: item.supplier_unit_cost != null ? String(item.supplier_unit_cost) : null,
  quoted_price: item.quoted_price != null ? String(item.quoted_price) : null,
  is_quoted: item.is_quoted ?? 0,
  delivery_cost: item.delivery_cost != null ? String(item.delivery_cost) : null,
  delivery_type: item.delivery_type ?? null,
  supplier_discount: item.supplier_discount != null ? String(item.supplier_discount) : null,
  supplier_confirms: item.supplier_confirms ?? 0,
  custom_blend_mix: null,
  created_at: '',
  updated_at: '',
  product: {
    id: item.product_id,
    product_name: item.product_name ?? 'Unknown Product',
    photo: null,
    unit_of_measure: '',
    specifications: '',
    product_type: '',
  },
  supplier: item.supplier
    ? { id: item.supplier.id, name: item.supplier.name, company_name: item.supplier.name }
    : null,
  deliveries: (item.deliveries ?? []).map((d) => ({
    id: d.id,
    order_item_id: d.order_item_id,
    quantity: typeof d.quantity === 'string' ? parseFloat(d.quantity) : d.quantity,
    delivery_date: d.delivery_date,
    delivery_time: d.delivery_time ?? null,
    status: ('status' in d ? (d as any).status : 'scheduled') as any,
    supplier_confirms: !!d.supplier_confirms,
    created_at: d.created_at,
    updated_at: d.updated_at,
  })),
});

// Type for tracking item updates
interface ItemUpdate {
  order_item_id: number;
  quantity: number;
  deliveries: EditDeliveryPayload[];
  originalQuantity: number;
  deliveriesChanged: boolean;
}

// ==================== COMPONENT ====================

const AdminOrderEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const adminMenuItems = getMenuItemsByRole(user?.role || 'admin');

  // Fetch order detail via admin hook
  const { data, isLoading, error, refetch } = useAdminOrderDetail(Number(id));

  // Edit mutation
  const editMutation = useAdminEditOrder();

  // Section collapse state
  const [contactSectionOpen, setContactSectionOpen] = useState(true);
  const [itemsSectionOpen, setItemsSectionOpen] = useState(true);

  // ==================== CONTACT INFO STATE ====================
  const [contactInfo, setContactInfo] = useState<ContactInfoFormState>({
    contact_person_name: '',
    contact_person_number: '',
    site_instructions: '',
  });
  const [initialContactInfo, setInitialContactInfo] = useState<ContactInfoFormState>({
    contact_person_name: '',
    contact_person_number: '',
    site_instructions: '',
  });

  // ==================== ITEMS STATE ====================
  const [itemsToRemove, setItemsToRemove] = useState<number[]>([]);
  const [itemUpdates, setItemUpdates] = useState<Map<number, ItemUpdate>>(new Map());
  const [itemsToAdd, setItemsToAdd] = useState<AddItemPayload[]>([]);

  // ==================== MODALS ====================
  const [editingItem, setEditingItem] = useState<OrderEditItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // ==================== INIT DATA ====================
  useEffect(() => {
    if (data?.data) {
      const order = data.data;
      const info: ContactInfoFormState = {
        contact_person_name: order.contact_person_name || '',
        contact_person_number: order.contact_person_number || '',
        site_instructions: (order as any).site_instructions || '',
      };
      setContactInfo(info);
      setInitialContactInfo(info);
    }
  }, [data]);

  // ==================== DERIVED ====================
  const contactInfoChanged = useMemo(
    () =>
      contactInfo.contact_person_name !== initialContactInfo.contact_person_name ||
      contactInfo.contact_person_number !== initialContactInfo.contact_person_number ||
      contactInfo.site_instructions !== initialContactInfo.site_instructions,
    [contactInfo, initialContactInfo]
  );

  const hasChanges = useMemo(
    () =>
      contactInfoChanged ||
      itemsToRemove.length > 0 ||
      itemUpdates.size > 0 ||
      itemsToAdd.length > 0,
    [contactInfoChanged, itemsToRemove, itemUpdates, itemsToAdd]
  );

  // Map admin items → OrderEditItem for reusable components
  const orderItems: OrderEditItem[] = useMemo(() => {
    if (!data?.data?.items) return [];
    return data.data.items.map(mapAdminItemToEditItem);
  }, [data]);

  // Build lookup map of itemUpdates by id for EditOrderItems
  const itemsUpdatedMap = useMemo(() => {
    const map = new Map<number, { quantity: number; deliveriesChanged: boolean }>();
    itemUpdates.forEach((update, itemId) => {
      map.set(itemId, {
        quantity: update.quantity,
        deliveriesChanged: update.deliveriesChanged,
      });
    });
    return map;
  }, [itemUpdates]);

  // ==================== HANDLERS ====================

  const handleEditItem = useCallback(
    (item: OrderEditItem) => {
      setEditingItem(item);
      setIsEditModalOpen(true);
    },
    []
  );

  const handleCloseEditModal = useCallback(() => {
    setEditingItem(null);
    setIsEditModalOpen(false);
  }, []);

  const handleSaveItemChanges = useCallback(
    (data: { order_item_id: number; quantity: number; deliveries: EditDeliveryPayload[] }) => {
      if (!editingItem) return;

      const originalItem = orderItems.find((i) => i.id === data.order_item_id);
      if (!originalItem) return;

      const deliveriesChanged =
        JSON.stringify(data.deliveries) !==
        JSON.stringify(
          originalItem.deliveries.map((d) => ({
            id: d.id,
            quantity: d.quantity,
            delivery_date: d.delivery_date,
            delivery_time: d.delivery_time,
          }))
        );

      setItemUpdates((prev) => {
        const newMap = new Map(prev);
        newMap.set(data.order_item_id, {
          order_item_id: data.order_item_id,
          quantity: data.quantity,
          deliveries: data.deliveries,
          originalQuantity: originalItem.quantity,
          deliveriesChanged,
        });
        return newMap;
      });

      handleCloseEditModal();
      toast.success('Item changes staged');
    },
    [editingItem, orderItems, handleCloseEditModal]
  );

  const handleRemoveItem = useCallback((itemId: number) => {
    setItemsToRemove((prev) => [...prev, itemId]);
    setItemUpdates((prev) => {
      const newMap = new Map(prev);
      newMap.delete(itemId);
      return newMap;
    });
    toast.success('Item marked for removal');
  }, []);

  const handleUndoRemove = useCallback((itemId: number) => {
    setItemsToRemove((prev) => prev.filter((i) => i !== itemId));
    toast.success('Removal undone');
  }, []);

  const handleOpenAddModal = useCallback(() => {
    setIsAddModalOpen(true);
  }, []);

  const handleCloseAddModal = useCallback(() => {
    setIsAddModalOpen(false);
  }, []);

  const handleAddItem = useCallback((item: AddItemPayload) => {
    setItemsToAdd((prev) => [...prev, item]);
    setIsAddModalOpen(false);
    toast.success('Item added to order');
  }, []);

  const handleRemoveStagedItem = useCallback((index: number) => {
    setItemsToAdd((prev) => prev.filter((_, i) => i !== index));
    toast.success('Staged item removed');
  }, []);

  // Existing product IDs (for warning in add modal)
  const existingProductIds = useMemo(() => {
    const ids: number[] = [];
    if (data?.data?.items) {
      data.data.items.forEach((item) => ids.push(item.product_id));
    }
    itemsToAdd.forEach((item) => ids.push(item.product_id));
    return ids;
  }, [data?.data?.items, itemsToAdd]);

  // ==================== SAVE ====================
  const handleSave = async () => {
    if (!id || !hasChanges) return;

    const payload: EditOrderPayload = {
      order: {},
      items_add: [],
      items_update: [],
      items_remove: [],
    };

    // Contact info changes
    if (contactInfoChanged) {
      if (contactInfo.contact_person_name !== initialContactInfo.contact_person_name) {
        payload.order!.contact_person_name = contactInfo.contact_person_name;
      }
      if (contactInfo.contact_person_number !== initialContactInfo.contact_person_number) {
        payload.order!.contact_person_number = contactInfo.contact_person_number;
      }
      if (contactInfo.site_instructions !== initialContactInfo.site_instructions) {
        payload.order!.site_instructions = contactInfo.site_instructions;
      }
    }

    if (itemsToAdd.length > 0) {
      payload.items_add = itemsToAdd;
    }
    if (itemsToRemove.length > 0) {
      payload.items_remove = itemsToRemove;
    }
    if (itemUpdates.size > 0) {
      payload.items_update = Array.from(itemUpdates.values()).map((u) => ({
        order_item_id: u.order_item_id,
        quantity: u.quantity,
        deliveries: u.deliveries,
      }));
    }

    try {
      await editMutation.mutateAsync({ orderId: Number(id), payload });
      // Reset state after success
      setInitialContactInfo({ ...contactInfo });
      setItemsToRemove([]);
      setItemUpdates(new Map());
      setItemsToAdd([]);
      refetch();
    } catch {
      // handled by mutation
    }
  };

  // ==================== RESET ====================
  const handleReset = () => {
    setContactInfo({ ...initialContactInfo });
    setItemsToRemove([]);
    setItemUpdates(new Map());
    setItemsToAdd([]);
    toast.success('All changes discarded');
  };

  // ==================== NAV ====================
  const handleBack = () => {
    if (hasChanges) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to leave?');
      if (!confirmed) return;
    }
    navigate(`/admin/orders/${id}`);
  };

  // ==================== RENDER ====================

  if (isLoading) {
    return (
      <DashboardLayout menuItems={adminMenuItems}>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="animate-spin text-blue-600 mx-auto mb-4" size={48} />
            <p className="text-gray-600 font-medium">Loading order details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !data?.data) {
    return (
      <DashboardLayout menuItems={adminMenuItems}>
        <div className="bg-white rounded-xl border-2 border-red-200 p-8 text-center">
          <AlertCircle className="mx-auto text-red-500 mb-3" size={40} />
          <p className="text-red-600 font-bold mb-4">
            {(error as Error)?.message || 'Order not found'}
          </p>
          <button
            onClick={() => navigate('/admin/orders')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Orders
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const order = data.data;

  return (
    <DashboardLayout menuItems={adminMenuItems}>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Back to order"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900">
                  Edit Order #{order.po_number}
                </h1>
                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm font-semibold rounded-full border border-indigo-200">
                  Admin Edit
                </span>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-semibold rounded-full border border-blue-200">
                  {order.workflow}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Update contact information and manage order items
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {hasChanges && (
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                Reset All
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={!hasChanges || editMutation.isPending}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg font-medium transition-colors ${
                hasChanges && !editMutation.isPending
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              {editMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save All Changes
                </>
              )}
            </button>
          </div>
        </div>

        {/* Pending Changes Banner */}
        {hasChanges && (
          <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 flex items-center gap-3">
            <Info className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-amber-800 font-semibold text-sm">
                You have{' '}
                {itemsToAdd.length + itemUpdates.size + itemsToRemove.length + (contactInfoChanged ? 1 : 0)}{' '}
                pending change(s)
              </p>
              <p className="text-amber-700 text-xs mt-0.5">
                Changes are batched — click "Save All Changes" to apply everything at once.
              </p>
            </div>
          </div>
        )}

        {/* ==================== CONTACT INFO SECTION ==================== */}
        <div className="bg-white rounded-xl border-2 border-gray-200 shadow-sm overflow-hidden">
          <button
            onClick={() => setContactSectionOpen(!contactSectionOpen)}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-left">
                <h2 className="font-bold text-gray-900">Contact Information</h2>
                <p className="text-xs text-gray-500">Contact person and site instructions</p>
              </div>
              {contactInfoChanged && (
                <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
                  Modified
                </span>
              )}
            </div>
            {contactSectionOpen ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {contactSectionOpen && (
            <div className="p-6 pt-2 border-t border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Contact Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    <User className="w-4 h-4 inline mr-1" />
                    Contact Person Name
                  </label>
                  <input
                    type="text"
                    value={contactInfo.contact_person_name}
                    onChange={(e) =>
                      setContactInfo((prev) => ({ ...prev, contact_person_name: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter contact name"
                  />
                </div>

                {/* Contact Number */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    <Phone className="w-4 h-4 inline mr-1" />
                    Contact Number
                  </label>
                  <input
                    type="text"
                    value={contactInfo.contact_person_number}
                    onChange={(e) =>
                      setContactInfo((prev) => ({ ...prev, contact_person_number: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter contact number"
                  />
                </div>

                {/* Site Instructions */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    <FileText className="w-4 h-4 inline mr-1" />
                    Site Instructions
                  </label>
                  <textarea
                    value={contactInfo.site_instructions}
                    onChange={(e) =>
                      setContactInfo((prev) => ({ ...prev, site_instructions: e.target.value }))
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                    placeholder="Enter site instructions"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ==================== ITEMS SECTION ==================== */}
        <div className="bg-white rounded-xl border-2 border-gray-200 shadow-sm overflow-hidden">
          <button
            onClick={() => setItemsSectionOpen(!itemsSectionOpen)}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Package className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-left">
                <h2 className="font-bold text-gray-900">Order Items</h2>
                <p className="text-xs text-gray-500">
                  {orderItems.length} item(s) in order
                </p>
              </div>
              {(itemsToRemove.length > 0 || itemUpdates.size > 0 || itemsToAdd.length > 0) && (
                <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
                  {itemsToRemove.length + itemUpdates.size + itemsToAdd.length} change(s)
                </span>
              )}
            </div>
            {itemsSectionOpen ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {itemsSectionOpen && (
            <div className="border-t border-gray-100">
              {/* Add Item Button */}
              <div className="p-4 border-b border-gray-100 flex justify-end">
                <button
                  onClick={handleOpenAddModal}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Item
                </button>
              </div>

              {/* Staged new items */}
              {itemsToAdd.length > 0 && (
                <div className="p-4 bg-green-50 border-b border-green-100">
                  <h3 className="text-sm font-bold text-green-800 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    New Items to Add ({itemsToAdd.length})
                  </h3>
                  <div className="space-y-2">
                    {itemsToAdd.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200"
                      >
                        <div>
                          <span className="font-medium text-gray-900">
                            Product #{item.product_id}
                          </span>
                          <span className="text-gray-500 ml-2">Qty: {item.quantity}</span>
                          {item.deliveries && item.deliveries.length > 0 && (
                            <span className="text-gray-400 ml-2 text-sm">
                              ({item.deliveries.length} delivery slot{item.deliveries.length > 1 ? 's' : ''})
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemoveStagedItem(index)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Existing items */}
              {orderItems.length > 0 && (
                <div className="p-4">
                  <EditOrderItems
                    items={orderItems}
                    itemsToRemove={itemsToRemove}
                    itemsUpdated={itemsUpdatedMap}
                    onEditItem={handleEditItem}
                    onRemoveItem={handleRemoveItem}
                    onUndoRemove={handleUndoRemove}
                  />
                </div>
              )}

              {/* Empty State */}
              {orderItems.length === 0 && itemsToAdd.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No items in this order</p>
                  <button
                    onClick={handleOpenAddModal}
                    className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    Add First Item
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ==================== BOTTOM ACTION BAR ==================== */}
        <div className="flex items-center justify-between p-4 bg-white rounded-xl border-2 border-gray-200 shadow-sm">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Order
          </button>

          <div className="flex items-center gap-3">
            {hasChanges && (
              <span className="text-sm text-amber-600 font-medium">
                {itemsToAdd.length + itemUpdates.size + itemsToRemove.length + (contactInfoChanged ? 1 : 0)}{' '}
                pending change(s)
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={!hasChanges || editMutation.isPending}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg font-medium transition-colors ${
                hasChanges && !editMutation.isPending
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              {editMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save All Changes
                </>
              )}
            </button>
          </div>
        </div>

        {/* Edit Item Modal */}
        <EditItemModal
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          item={editingItem}
          onSave={handleSaveItemChanges}
          isAdmin={true}
        />

        {/* Add Item Modal */}
        <AddItemModal
          isOpen={isAddModalOpen}
          onClose={handleCloseAddModal}
          onAdd={handleAddItem}
          existingProductIds={existingProductIds}
          isAdmin={true}
        />
      </div>
    </DashboardLayout>
  );
};

export default AdminOrderEdit;