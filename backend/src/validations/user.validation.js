import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(60, 'Name cannot exceed 60 characters')
      .optional(),
    
    headline: z
      .string()
      .max(120, 'Headline cannot exceed 120 characters')
      .optional()
      .nullable(),
    
    bio: z
      .string()
      .max(500, 'Bio cannot exceed 500 characters')
      .optional()
      .nullable(),
    
    skills: z
      .array(z.string().trim().max(30))
      .optional(),
    
    company: z
      .object({
        name: z.string().trim().max(100).optional().nullable(),
        website: z.string().trim().url('Invalid website URL format').or(z.literal('')).optional().nullable(),
      })
      .optional()
      .nullable(),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z
      .string({ required_error: 'Current password is required' })
      .min(1, 'Current password is required'),
    
    newPassword: z
      .string({ required_error: 'New password is required' })
      .min(8, 'New password must be at least 8 characters')
      .regex(/[A-Z]/, 'New password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'New password must contain at least one number'),
  }),
});
