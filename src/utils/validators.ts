// src/utils/validators.ts
import { z } from 'zod';
export const AvailabilityEnum = z.enum(["In Stock", "Out of Stock", "Limited"]);
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
  delivery_radius: z.number().positive('Delivery radius must be positive').optional(),
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



// ==================== SUPPLIER PRODUCT MANAGEMENT SCHEMAS ====================

/**
 * Schema for adding a product to supplier offers
 */
export const addOfferSchema = z.object({
  price: z
    .string()
    .min(1, "Price is required")
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, {
      message: "Price must be a positive number",
    }),
  availability_status: AvailabilityEnum, // required by presence
});
/**
 * Schema for updating supplier offer
 */
export const updateOfferSchema = z.object({
  price: z
    .string()
    .min(1, "Price is required")
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, {
      message: "Price must be a positive number",
    }),
  availability_status: AvailabilityEnum,
});

/**
 * Schema for requesting new master product
 */
export const requestProductSchema = z
  .object({
    product_name: z
      .string()
      .min(1, "Product name is required")
      .min(3, "Product name must be at least 3 characters")
      .max(255, "Product name must not exceed 255 characters"),

    product_type: z
      .string()
      .min(1, "Product type is required")
      .max(255, "Product type must not exceed 255 characters"),

    // If you need a custom "required" message, use superRefine below
    category_id: z.number().positive("Please select a valid category"),

    unit_of_measure: z
      .string()
      .min(1, "Unit of measure is required")
      .max(50, "Unit of measure must not exceed 50 characters"),

    specifications: z.string().max(1000, "Specifications must not exceed 1000 characters").optional(),

    price: z
      .string()
      .min(1, "Price is required")
      .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, {
        message: "Price must be a positive number",
      }),

    availability_status: AvailabilityEnum,
  })
  .superRefine((val, ctx) => {
    if (val.category_id === undefined || val.category_id === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["category_id"],
        message: "Category is required",
      });
    }
  });




// ==================== TYPE EXPORTS ====================

export type LoginFormData = z.infer<typeof loginSchema>;
export type ClientRegistrationFormData = z.infer<typeof clientRegistrationSchema>;
export type SupplierRegistrationFormData = z.infer<typeof supplierRegistrationSchema>;
export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type RequestProductFormData = z.infer<typeof requestProductSchema>;
export type AddOfferFormData = z.infer<typeof addOfferSchema>;
export type UpdateOfferFormData = z.infer<typeof updateOfferSchema>;