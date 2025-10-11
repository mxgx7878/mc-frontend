// src/utils/validators.ts
import { z } from 'zod';

// ==================== AUTH SCHEMAS ====================

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const clientRegistrationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  contact_name: z.string().min(1, 'Contact name is required'),
  contact_number: z.string().min(1, 'Contact number is required'),
  shipping_address: z.string().min(1, 'Shipping address is required'),
  billing_address: z.string().min(1, 'Billing address is required'),
  company_name: z.string().optional(),
  profile_image: z.any().optional(),
  lat: z.number(),
  long: z.number(),
});

export const supplierRegistrationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  contact_name: z.string().min(1, 'Contact name is required'),
  contact_number: z.string().min(1, 'Contact number is required'),
  location: z.string().min(1, 'Location is required'),
  company_name: z.string().min(1, 'Company name is required'),
  profile_image: z.any().optional(),
});

// ==================== PROFILE SCHEMAS ====================

export const profileUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  email: z.string().email('Invalid email address').optional(),
  contact_name: z.string().optional(),
  contact_number: z.string().optional(),
  company_name: z.string().optional(),
  profile_image: z.any().optional(),
  
  // Client-specific fields
  shipping_address: z.string().optional(),
  billing_address: z.string().optional(),
  lat: z.number().optional(),
  long: z.number().optional(),
  
  // Supplier-specific fields
  location: z.string().optional(),
  delivery_radius: z.number().positive('Delivery radius must be positive').optional(),
});

export const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z.string().min(6, 'New password must be at least 6 characters'),
  new_password_confirmation: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.new_password === data.new_password_confirmation, {
  message: "Passwords don't match",
  path: ['new_password_confirmation'],
});

// ==================== TYPE EXPORTS ====================

export type LoginFormData = z.infer<typeof loginSchema>;
export type ClientRegistrationFormData = z.infer<typeof clientRegistrationSchema>;
export type SupplierRegistrationFormData = z.infer<typeof supplierRegistrationSchema>;
export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;