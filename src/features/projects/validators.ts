// --- src/features/projects/validators.ts ---
import { z } from 'zod';

export const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  site_contact_name: z.string().max(255, 'Max 255 characters').optional().or(z.literal('').transform(() => undefined)),
  site_contact_phone: z.string().max(50, 'Max 50 characters').optional().or(z.literal('').transform(() => undefined)),
  site_instructions: z.string().optional().or(z.literal('').transform(() => undefined)),
  delivery_address: z.string().min(1, 'Delivery address is required').max(500, 'Address is too long'),
  delivery_lat: z.number().min(-90, 'Invalid latitude').max(90, 'Invalid latitude'),
  delivery_long: z.number().min(-180, 'Invalid longitude').max(180, 'Invalid longitude'),
});
export type ProjectFormValues = z.infer<typeof projectSchema>;