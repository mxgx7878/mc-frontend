// --- src/features/projects/validators.ts ---
import { z } from 'zod';

export const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  site_contact_name: z.string().max(255, 'Max 255 characters').optional().or(z.literal('').transform(() => undefined)),
  site_contact_phone: z.string().max(50, 'Max 50 characters').optional().or(z.literal('').transform(() => undefined)),
  site_instructions: z.string().optional().or(z.literal('').transform(() => undefined)),
});
export type ProjectFormValues = z.infer<typeof projectSchema>;