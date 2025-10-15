// src/utils/cartUtils.ts
import type { CartItem } from '../types/order.types';

const CART_STORAGE_KEY = 'client_order_cart';

export const cartUtils = {
  // Get all cart items
  getCart: (): CartItem[] => {
    try {
      const cart = localStorage.getItem(CART_STORAGE_KEY);
      return cart ? JSON.parse(cart) : [];
    } catch (error) {
      console.error('Error reading cart from localStorage:', error);
      return [];
    }
  },

  // Save cart to localStorage
  saveCart: (cart: CartItem[]): void => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  },

  // Add item to cart
  addItem: (product: {
    id: number;
    product_name: string;
    photo: string;
    product_type: string;
    unit_of_measure: string;
  }): CartItem[] => {
    const cart = cartUtils.getCart();
    
    // Check if product already exists
    const existingIndex = cart.findIndex(item => item.product_id === product.id);
    
    if (existingIndex > -1) {
      // Increment quantity
      cart[existingIndex].quantity += 1;
    } else {
      // Add new item
      cart.push({
        product_id: product.id,
        product_name: product.product_name,
        product_photo: product.photo,
        product_type: product.product_type,
        quantity: 1,
        unit_of_measure: product.unit_of_measure,
        custom_blend_mix: undefined,
      });
    }
    
    cartUtils.saveCart(cart);
    return cart;
  },

  // Update item quantity
  updateQuantity: (productId: number, quantity: number): CartItem[] => {
    const cart = cartUtils.getCart();
    const index = cart.findIndex(item => item.product_id === productId);
    
    if (index > -1) {
      if (quantity <= 0) {
        // Remove item if quantity is 0 or less
        cart.splice(index, 1);
      } else {
        cart[index].quantity = quantity;
      }
      cartUtils.saveCart(cart);
    }
    
    return cart;
  },

  // Update custom blend
  updateCustomBlend: (productId: number, customBlend: string): CartItem[] => {
    const cart = cartUtils.getCart();
    const index = cart.findIndex(item => item.product_id === productId);
    
    if (index > -1) {
      cart[index].custom_blend_mix = customBlend || undefined;
      cartUtils.saveCart(cart);
    }
    
    return cart;
  },

  // Remove item
  removeItem: (productId: number): CartItem[] => {
    const cart = cartUtils.getCart();
    const filtered = cart.filter(item => item.product_id !== productId);
    cartUtils.saveCart(filtered);
    return filtered;
  },

  // Clear entire cart
  clearCart: (): void => {
    localStorage.removeItem(CART_STORAGE_KEY);
  },

  // Get cart count
  getCartCount: (): number => {
    const cart = cartUtils.getCart();
    return cart.reduce((total, item) => total + item.quantity, 0);
  },

  // Check if product is in cart
  isInCart: (productId: number): boolean => {
    const cart = cartUtils.getCart();
    return cart.some(item => item.product_id === productId);
  },
};

