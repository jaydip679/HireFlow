import { z } from 'zod';

export const applySchema = z.object({
  body: z.object({
    jobId: z
      .string({ required_error: 'Job ID is required' })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid Job ID format'),
    
    coverLetter: z
      .string()
      .max(2000, 'Cover letter cannot exceed 2000 characters')
      .optional()
      .nullable(),
  }),
});

export const updateStatusSchema = z.object({
  body: z.object({
    status: z.enum(['reviewed', 'shortlisted', 'rejected', 'hired', 'withdrawn'], {
      required_error: 'Status is required',
    }),
    
    employerNote: z
      .string()
      .max(1000, 'Employer note cannot exceed 1000 characters')
      .optional()
      .nullable(),
  }),
});
