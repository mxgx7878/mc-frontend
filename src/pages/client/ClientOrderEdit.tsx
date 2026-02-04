// src/pages/client/ClientOrderEdit.tsx
/**
 * CLIENT ORDER EDIT PAGE - STEP 2
 * 
 * Complete order editing with:
 * - Contact Information (Step 1)
 * - Items Management (Step 2)
 *   - View items with deliveries
 *   - Edit item quantity
 *   - Edit split deliveries
 *   - Remove items
 * 
 * Future: Add new items (Step 3)
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
import DashboardLayout from '../../components/layout/DashboardLayout';
import { clientMenuItems } from '../../utils/menuItems';
import { useClientOrderDetail } from '../../features/clientOrders/hooks';
import { useEditOrder } from '../../features/clientOrders/useOrderEdit';
import EditOrderItems from '../../components/client/orderEdit/EditOrderItems';
import EditItemModal from '../../components/client/orderEdit/EditItemModal';
import AddItemModal from '../../components/client/orderEdit/AddItemModal';
import type { 
  ContactInfoFormState, 
  OrderEditItem,
  EditOrderPayload,
  EditDeliveryPayload,
  AddItemPayload,
} from '../../types/orderEdit.types';

// Type for tracking item updates
interface ItemUpdate {
  order_item_id: number;
  quantity: number;
  deliveries: EditDeliveryPayload[];
  originalQuantity: number;
  deliveriesChanged: boolean;
}

const ClientOrderEdit = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  
  // Fetch order details
  const { data, isLoading, error, refetch } = useClientOrderDetail(Number(orderId));
  
  // Edit mutation
  const editMutation = useEditOrder();
  
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
  
  // Edit modal state
  const [editingItem, setEditingItem] = useState<OrderEditItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Add item modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // ==================== INITIALIZE DATA ====================
  useEffect(() => {
    if (data?.data?.order) {
      const order = data.data.order;
      const initial: ContactInfoFormState = {
        contact_person_name: order.contact_person_name || '',
        contact_person_number: order.contact_person_number || '',
        site_instructions: order.project?.site_instructions || '',
      };
      setContactInfo(initial);
      setInitialContactInfo(initial);
      
      // Reset items state
      setItemsToRemove([]);
      setItemUpdates(new Map());
      setItemsToAdd([]);
    }
  }, [data]);

  // ==================== CHANGE DETECTION ====================
  const contactInfoChanged = useMemo(() => {
    return (
      contactInfo.contact_person_name !== initialContactInfo.contact_person_name ||
      contactInfo.contact_person_number !== initialContactInfo.contact_person_number ||
      contactInfo.site_instructions !== initialContactInfo.site_instructions
    );
  }, [contactInfo, initialContactInfo]);

  const itemsChanged = useMemo(() => {
    return itemsToRemove.length > 0 || itemUpdates.size > 0 || itemsToAdd.length > 0;
  }, [itemsToRemove, itemUpdates, itemsToAdd]);

  const hasChanges = contactInfoChanged || itemsChanged;

  // Track which items have been updated for visual feedback
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
  
  // Contact info change
  const handleContactInputChange = (
    field: keyof ContactInfoFormState,
    value: string
  ) => {
    setContactInfo(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Open edit modal for item
  const handleEditItem = useCallback((item: OrderEditItem) => {
    setEditingItem(item);
    setIsEditModalOpen(true);
  }, []);

  // Close edit modal
  const handleCloseEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setEditingItem(null);
  }, []);

  // Save item changes from modal
  const handleSaveItemChanges = useCallback((data: {
    order_item_id: number;
    quantity: number;
    deliveries: EditDeliveryPayload[];
  }) => {
    const originalItem = editingItem;
    if (!originalItem) return;

    // Check if anything actually changed
    const qtyChanged = data.quantity !== originalItem.quantity;
    const deliveriesChanged = JSON.stringify(data.deliveries) !== JSON.stringify(
      originalItem.deliveries
        .filter(d => d.status !== 'delivered') // Only consider non-delivered for comparison
        .map(d => ({
          id: d.id,
          quantity: d.quantity,
          delivery_date: d.delivery_date?.split('T')[0],
          delivery_time: d.delivery_time,
        }))
    );

    if (!qtyChanged && !deliveriesChanged) {
      // No changes, just close
      handleCloseEditModal();
      toast.success('No changes made');
      return;
    }

    // Store the update
    setItemUpdates(prev => {
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
  }, [editingItem, handleCloseEditModal]);

  // Mark item for removal
  const handleRemoveItem = useCallback((itemId: number) => {
    setItemsToRemove(prev => [...prev, itemId]);
    // Also remove from updates if it was there
    setItemUpdates(prev => {
      const newMap = new Map(prev);
      newMap.delete(itemId);
      return newMap;
    });
    toast.success('Item marked for removal');
  }, []);

  // Undo item removal
  const handleUndoRemove = useCallback((itemId: number) => {
    setItemsToRemove(prev => prev.filter(id => id !== itemId));
    toast.success('Removal undone');
  }, []);

  // Open add item modal
  const handleOpenAddModal = useCallback(() => {
    setIsAddModalOpen(true);
  }, []);

  // Close add item modal
  const handleCloseAddModal = useCallback(() => {
    setIsAddModalOpen(false);
  }, []);

  // Add new item from modal
  const handleAddItem = useCallback((item: AddItemPayload) => {
    setItemsToAdd(prev => [...prev, item]);
    setIsAddModalOpen(false);
    toast.success('Item added to order');
  }, []);

  // Remove staged item (from itemsToAdd)
  const handleRemoveStagedItem = useCallback((index: number) => {
    setItemsToAdd(prev => prev.filter((_, i) => i !== index));
    toast.success('Staged item removed');
  }, []);

  // Get existing product IDs (for warning in add modal)
  const existingProductIds = useMemo(() => {
    const ids: number[] = [];
    // From existing order items
    if (data?.data?.items) {
      data.data.items.forEach((item: any) => ids.push(item.product_id));
    }
    // Also include products from itemsToAdd
    itemsToAdd.forEach(item => ids.push(item.product_id));
    return ids;
  }, [data?.data?.items, itemsToAdd]);

  // ==================== SAVE ALL CHANGES ====================
  const handleSave = async () => {
    if (!orderId || !hasChanges) return;

    // Build payload
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

    // Items to add
    if (itemsToAdd.length > 0) {
      payload.items_add = itemsToAdd;
    }

    // Items to remove
    if (itemsToRemove.length > 0) {
      payload.items_remove = itemsToRemove;
    }

    // Items to update
    if (itemUpdates.size > 0) {
      payload.items_update = Array.from(itemUpdates.values()).map(update => ({
        order_item_id: update.order_item_id,
        quantity: update.quantity,
        deliveries: update.deliveries,
      }));
    }

    try {
      await editMutation.mutateAsync({
        orderId: Number(orderId),
        payload,
      });
      
      // Reset state after successful save
      setInitialContactInfo({ ...contactInfo });
      setItemsToRemove([]);
      setItemUpdates(new Map());
      setItemsToAdd([]);
      
      // Refetch to get updated data
      refetch();
    } catch (error) {
      // Error handled by mutation
    }
  };

  // Reset all changes
  const handleReset = () => {
    setContactInfo({ ...initialContactInfo });
    setItemsToRemove([]);
    setItemUpdates(new Map());
    setItemsToAdd([]);
    toast.success('All changes discarded');
  };

  // Back navigation
  const handleBack = () => {
    if (hasChanges) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to leave?'
      );
      if (!confirmed) return;
    }
    navigate(`/client/orders/${orderId}`);
  };

  // ==================== RENDER ====================
  
  if (isLoading) {
    return (
      <DashboardLayout menuItems={clientMenuItems}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            <p className="text-gray-600 font-medium">Loading order details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !data?.data) {
    return (
      <DashboardLayout menuItems={clientMenuItems}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
            <p className="text-gray-600 mb-4">
              The order you're trying to edit doesn't exist or you don't have access.
            </p>
            <button
              onClick={() => navigate('/client/orders')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Orders
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const { order, items } = data.data;

  // Cast items to OrderEditItem type (assuming API returns compatible structure)
  const orderItems = (items || []) as OrderEditItem[];

  return (
    <DashboardLayout menuItems={clientMenuItems}>
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
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-semibold rounded-full border border-blue-200">
                  {order.order_status}
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

        {/* Unsaved Changes Banner */}
        {hasChanges && (
          <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-amber-800">You have unsaved changes</p>
              <div className="text-sm text-amber-700 mt-1 space-y-1">
                {contactInfoChanged && (
                  <p>• Contact information modified</p>
                )}
                {itemsToAdd.length > 0 && (
                  <p>• {itemsToAdd.length} new item(s) to add</p>
                )}
                {itemUpdates.size > 0 && (
                  <p>• {itemUpdates.size} item(s) modified</p>
                )}
                {itemsToRemove.length > 0 && (
                  <p>• {itemsToRemove.length} item(s) marked for removal</p>
                )}
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={editMutation.isPending}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium text-sm"
            >
              Save Now
            </button>
          </div>
        )}

        {/* Contact Information Section */}
        <div className="bg-white rounded-xl border-2 border-gray-200 shadow-sm overflow-hidden">
          <button
            onClick={() => setContactSectionOpen(!contactSectionOpen)}
            className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b-2 border-blue-200 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <h2 className="text-lg font-bold text-gray-900">Contact Information</h2>
                <p className="text-sm text-gray-600">
                  {contactInfoChanged ? (
                    <span className="text-amber-600 font-medium">Modified</span>
                  ) : (
                    'Update contact details for this order'
                  )}
                </p>
              </div>
            </div>
            {contactSectionOpen ? (
              <ChevronUp className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-600" />
            )}
          </button>
          
          {contactSectionOpen && (
            <div className="p-6 space-y-5">
              {/* Contact Person Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <span className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    Contact Person Name
                  </span>
                </label>
                <input
                  type="text"
                  value={contactInfo.contact_person_name}
                  onChange={(e) => handleContactInputChange('contact_person_name', e.target.value)}
                  placeholder="Enter contact person name"
                  className={`w-full px-4 py-3 border-2 rounded-lg transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    contactInfo.contact_person_name !== initialContactInfo.contact_person_name
                      ? 'border-amber-300 bg-amber-50'
                      : 'border-gray-200'
                  }`}
                />
                {contactInfo.contact_person_name !== initialContactInfo.contact_person_name && (
                  <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Modified
                  </p>
                )}
              </div>

              {/* Contact Person Number */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <span className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    Contact Phone Number
                  </span>
                </label>
                <input
                  type="tel"
                  value={contactInfo.contact_person_number}
                  onChange={(e) => handleContactInputChange('contact_person_number', e.target.value)}
                  placeholder="Enter phone number (e.g., 0300-1234567)"
                  className={`w-full px-4 py-3 border-2 rounded-lg transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    contactInfo.contact_person_number !== initialContactInfo.contact_person_number
                      ? 'border-amber-300 bg-amber-50'
                      : 'border-gray-200'
                  }`}
                />
                {contactInfo.contact_person_number !== initialContactInfo.contact_person_number && (
                  <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Modified
                  </p>
                )}
              </div>

              {/* Site Instructions */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-500" />
                    Site Instructions
                  </span>
                </label>
                <textarea
                  value={contactInfo.site_instructions}
                  onChange={(e) => handleContactInputChange('site_instructions', e.target.value)}
                  placeholder="Enter any special instructions for the delivery site..."
                  rows={3}
                  className={`w-full px-4 py-3 border-2 rounded-lg transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${
                    contactInfo.site_instructions !== initialContactInfo.site_instructions
                      ? 'border-amber-300 bg-amber-50'
                      : 'border-gray-200'
                  }`}
                />
                {contactInfo.site_instructions !== initialContactInfo.site_instructions && (
                  <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Modified
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Order Items Section */}
        <div className="bg-white rounded-xl border-2 border-gray-200 shadow-sm overflow-hidden">
          <button
            onClick={() => setItemsSectionOpen(!itemsSectionOpen)}
            className="w-full bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b-2 border-purple-200 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <h2 className="text-lg font-bold text-gray-900">
                  Order Items ({orderItems.length + itemsToAdd.length})
                </h2>
                <p className="text-sm text-gray-600">
                  {itemsChanged ? (
                    <span className="text-amber-600 font-medium">
                      {itemsToAdd.length > 0 && `${itemsToAdd.length} to add`}
                      {itemsToAdd.length > 0 && itemUpdates.size > 0 && ', '}
                      {itemUpdates.size > 0 && `${itemUpdates.size} modified`}
                      {(itemsToAdd.length > 0 || itemUpdates.size > 0) && itemsToRemove.length > 0 && ', '}
                      {itemsToRemove.length > 0 && `${itemsToRemove.length} to remove`}
                    </span>
                  ) : (
                    'Edit quantities and delivery schedules'
                  )}
                </p>
              </div>
            </div>
            {itemsSectionOpen ? (
              <ChevronUp className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-600" />
            )}
          </button>
          
          {itemsSectionOpen && (
            <div className="p-6">
              {/* Add Item Button */}
              <div className="mb-4">
                <button
                  onClick={handleOpenAddModal}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm"
                >
                  <Plus className="w-5 h-5" />
                  Add New Item
                </button>
              </div>

              {/* Staged Items (Items to Add) */}
              {itemsToAdd.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-green-700 mb-3 flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    New Items to Add ({itemsToAdd.length})
                  </h3>
                  <div className="space-y-3">
                    {itemsToAdd.map((item, index) => (
                      <div
                        key={index}
                        className="border-2 border-green-300 bg-green-50 rounded-xl p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-gray-900">
                              Product ID: {item.product_id}
                            </p>
                            <p className="text-sm text-gray-600">
                              Quantity: {item.quantity}
                              {item.deliveries && item.deliveries.length > 0 && (
                                <span className="ml-2 text-green-600">
                                  • {item.deliveries.length} delivery slot(s)
                                </span>
                              )}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full border border-green-300">
                              New
                            </span>
                            <button
                              onClick={() => handleRemoveStagedItem(index)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Remove"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Existing Items */}
              {orderItems.length > 0 && (
                <div>
                  {itemsToAdd.length > 0 && (
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">
                      Existing Items ({orderItems.length})
                    </h3>
                  )}
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

        {/* Bottom Action Bar */}
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
                {itemsToAdd.length + itemUpdates.size + itemsToRemove.length + (contactInfoChanged ? 1 : 0)} pending change(s)
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
        />

        {/* Add Item Modal */}
        <AddItemModal
          isOpen={isAddModalOpen}
          onClose={handleCloseAddModal}
          onAdd={handleAddItem}
          existingProductIds={existingProductIds}
        />
      </div>
    </DashboardLayout>
  );
};

export default ClientOrderEdit;