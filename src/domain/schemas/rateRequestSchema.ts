import { z } from 'zod';
import { AppError } from '../../errors/AppError';
import { RateRequest } from '../models/RateRequest';

const addressSchema = z.object({
  street: z.array(z.string().min(1)).min(1).max(3),
  city: z.string().min(1),
  state: z.string().min(2).max(3),
  postalCode: z.string().min(1),
  countryCode: z.string().length(2),
});

const packageSchema = z.object({
  weight: z.number().positive(),
  weightUnit: z.enum(['LBS', 'KGS']),
  length: z.number().positive().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  dimensionUnit: z.enum(['IN', 'CM']).optional(),
});

export const rateRequestSchema = z.object({
  requestId: z.string().min(1),
  shipper: addressSchema,
  recipient: addressSchema,
  packages: z.array(packageSchema).min(1),
  serviceCode: z.string().optional(),
}) satisfies z.ZodType<RateRequest>;

export function validateRateRequest(input: unknown): RateRequest {
  const result = rateRequestSchema.safeParse(input);

  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ');
    throw new AppError('VALIDATION_ERROR', `Invalid rate request — ${issues}`, 400);
  }

  return result.data;
}
