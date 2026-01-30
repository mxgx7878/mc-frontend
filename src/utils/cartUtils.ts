// src/utils/cartUtils.ts
/**
 * CART UTILITIES
 * 
 * UPDATED: Each cart item now includes delivery_slots array
 * - When adding to cart, initialize with one default slot (quantity = total, date = null, time = null)
 * - User will configure slots in Step 3
 * 
 * WHY: This allows cart to work in Step 1 and Step 2, and user configures delivery scheduling in Step 3
 */

import type { CartItem, DeliverySlot } from '../types/order.types';
import { v4 as uuidv4 } from 'uuid';

const CART_STORAGE_KEY = 'shopping_cart';

/**
 * Generate a unique slot ID for tracking
 * 
 * WHY: Needed for React keys and updating specific slots
 */
const generateSlotId = (): string => {
  return uuidv4();
};

/**
 * Get cart from localStorage
 */
export const cartUtils = {
  getCart: (): CartItem[] => {
    try {
      const cartData = localStorage.getItem(CART_STORAGE_KEY);
      if (!cartData) return [];
      
      const cart = JSON.parse(cartData) as CartItem[];
      
      // Ensure all items have delivery_slots array (for backward compatibility)
      return cart.map(item => ({
        ...item,
        delivery_slots: item.delivery_slots || [
          {
            slot_id: generateSlotId(),
            quantity: item.quantity,
            delivery_date: '',
            delivery_time: '',
          }
        ]
      }));
    } catch (error) {
      console.error('Failed to parse cart from localStorage:', error);
      return [];
    }
  },

  /**
   * Save cart to localStorage
   */
  saveCart: (cart: CartItem[]): void => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
      console.error('Failed to save cart to localStorage:', error);
    }
  },

  /**
   * Add item to cart with default delivery slot
   * 
   * WHAT: Creates a single delivery slot with full quantity
   * WHY: User hasn't configured split deliveries yet - that happens in Step 3
   */
  addItem: (item: Omit<CartItem, 'delivery_slots'>): CartItem[] => {
    const cart = cartUtils.getCart();
    const existingIndex = cart.findIndex(i => i.product_id === item.product_id);

    if (existingIndex > -1) {
      // Product already in cart - increase quantity of first slot
      cart[existingIndex].quantity += 1;
      cart[existingIndex].delivery_slots[0].quantity += 1;
    } else {
      // New product - add with default delivery slot
      const newItem: CartItem = {
        ...item,
        quantity: 1,
        delivery_slots: [
          {
            slot_id: generateSlotId(),
            quantity: 1,
            delivery_date: '',
            delivery_time: '',
          }
        ]
      };
      cart.push(newItem);
    }

    cartUtils.saveCart(cart);
    return cart;
  },

  /**
   * Update total quantity of an item
   * 
   * WHAT: Updates total quantity and adjusts delivery slots proportionally
   * WHY: When user changes quantity in Step 2, maintain slot proportions
   * HOW: Scale each slot's quantity by the ratio of new/old total quantity
   */
  updateQuantity: (productId: number, newQuantity: number): CartItem[] => {
    const cart = cartUtils.getCart();
    const itemIndex = cart.findIndex(i => i.product_id === productId);

    if (itemIndex === -1) return cart;

    const item = cart[itemIndex];
    const oldQuantity = item.quantity;
    const ratio = newQuantity / oldQuantity;

    // Scale each slot proportionally
    item.quantity = newQuantity;
    item.delivery_slots = item.delivery_slots.map(slot => ({
      ...slot,
      quantity: parseFloat((slot.quantity * ratio).toFixed(2))
    }));

    cartUtils.saveCart(cart);
    return cart;
  },

  /**
   * Update delivery slots for a specific product
   * 
   * WHAT: Replace all delivery slots for a product (used in Step 3)
   * WHY: User configures split deliveries in Step 3
   */
  updateDeliverySlots: (productId: number, slots: DeliverySlot[]): CartItem[] => {
    const cart = cartUtils.getCart();
    const itemIndex = cart.findIndex(i => i.product_id === productId);

    if (itemIndex === -1) return cart;

    cart[itemIndex].delivery_slots = slots;
    
    // Update total quantity to match slots sum
    cart[itemIndex].quantity = slots.reduce((sum, slot) => sum + slot.quantity, 0);

    cartUtils.saveCart(cart);
    return cart;
  },

  /**
   * Remove item from cart
   */
  removeItem: (productId: number): CartItem[] => {
    const cart = cartUtils.getCart();
    const filtered = cart.filter(i => i.product_id !== productId);
    cartUtils.saveCart(filtered);
    return filtered;
  },

  /**
   * Update custom blend for an item
   */
  updateCustomBlend: (productId: number, blend: string): CartItem[] => {
    const cart = cartUtils.getCart();
    const itemIndex = cart.findIndex(i => i.product_id === productId);

    if (itemIndex > -1) {
      cart[itemIndex].custom_blend_mix = blend;
      cartUtils.saveCart(cart);
    }

    return cart;
  },

  /**
   * Check if product is in cart
   */
  isInCart: (productId: number): boolean => {
    const cart = cartUtils.getCart();
    return cart.some(item => item.product_id === productId);
  },

  /**
   * Clear entire cart
   */
  clearCart: (): void => {
    localStorage.removeItem(CART_STORAGE_KEY);
  },

  /**
   * Get total items count
   */
  getTotalItems: (): number => {
    const cart = cartUtils.getCart();
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  },
};