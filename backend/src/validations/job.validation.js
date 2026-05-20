import { z } from 'zod';

export const createJobSchema = z.object({
  body: z.object({
    title: z
      .string({ required_error: 'Job title is required' })
      .trim()
      .min(5, 'Title must be at least 5 characters')
      .max(100, 'Title cannot exceed 100 characters'),
    
    description: z
      .string({ required_error: 'Job description is required' })
      .trim()
      .min(50, 'Description must be at least 50 characters')
      .max(5000, 'Description cannot exceed 5000 characters'),
    
    skillsRequired: z
      .array(z.string().trim().max(30, 'Skill name is too long'))
      .max(20, 'Cannot require more than 20 skills')
      .default([]),
    
    jobType: z.enum(['full-time', 'part-time', 'contract', 'internship'], {
      required_error: 'Job type is required',
    }),
    
    location: z
      .string()
      .trim()
      .max(100, 'Location is too long')
      .optional()
      .nullable(),
    
    isRemote: z
      .boolean()
      .default(false),
    
    salary: z
      .object({
        min: z.number().min(0, 'Salary min must be positive').optional().nullable(),
        max: z.number().min(0, 'Salary max must be positive').optional().nullable(),
        currency: z.string().length(3, 'Currency must be 3-character ISO').default('USD'),
      })
      .optional()
      .nullable()
      .refine(
        (s) => !s || s.min === undefined || s.max === undefined || s.min === null || s.max === null || s.max >= s.min,
        { message: 'Salary max must be greater than or equal to min' }
      ),
    
    deadline: z
      .string()
      .datetime({ message: 'Deadline must be a valid ISO datetime' })
      .optional()
      .nullable()
      .refine(
        (d) => !d || new Date(d) > new Date(),
        { message: 'Deadline must be in the future' }
      ),
  }),
});

export const listJobsQuerySchema = z.object({
  query: z.object({
    q: z
      .string()
      .trim()
      .max(100, 'Query search term too long')
      .optional(),
    
    skills: z
      .string()
      .optional(),   // comma-separated, split in service
    
    jobType: z
      .enum(['full-time', 'part-time', 'contract', 'internship'])
      .optional(),
    
    location: z
      .string()
      .trim()
      .max(100)
      .optional(),
    
    isRemote: z
      .enum(['true', 'false'])
      .transform((v) => v === 'true')
      .optional(),
    
    salaryMin: z
      .string()
      .regex(/^\d+$/, 'salaryMin must be a positive integer')
      .transform(Number)
      .optional(),
    
    salaryMax: z
      .string()
      .regex(/^\d+$/, 'salaryMax must be a positive integer')
      .transform(Number)
      .optional(),
    
    page: z
      .string()
      .regex(/^\d+$/, 'page must be a positive integer')
      .transform(Number)
      .default('1'),
    
    limit: z
      .string()
      .regex(/^\d+$/, 'limit must be a positive integer')
      .transform(Number)
      .default('10'),
    
    sortBy: z
      .enum(['createdAt', 'salary', 'applicationCount'])
      .default('createdAt'),
    
    order: z
      .enum(['asc', 'desc'])
      .default('desc'),
  }),
});
export const updateJobSchema = createJobSchema.deepPartial();
