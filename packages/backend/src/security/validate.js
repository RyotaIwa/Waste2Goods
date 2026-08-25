import { z } from 'zod';

export const RegisterSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(100),
  lastName:  z.string().trim().min(1, 'Last name is required').max(100),
  email:     z.string().trim().email('Invalid email format').max(200),
  password:  z.string().min(6, 'Password must be at least 6 characters').max(120),
  phone:     z.string().trim().max(50).optional().or(z.literal('')),
  province:  z.string().trim().min(1, 'Province is required').max(100),
  city:      z.string().trim().min(1, 'City is required').max(100),
  barangayName: z.string().trim().min(1, 'Barangay is required').max(100),
  streetAddress: z.string().trim().max(255).optional().or(z.literal('')),
  barangayId: z.coerce.number().int().positive().optional().default(1),
});

export const LoginSchema = z.object({
  email:    z.string().trim().email('Invalid email').max(200),
  password: z.string().min(1, 'Password is required').max(120),
});

export const TransactionSchema = z.object({
  userId:     z.string().trim().min(2, 'userId required').max(50),
  materialId: z.coerce.number().int().positive().default(1),
  weightKg:   z.coerce.number().positive('weightKg must be > 0').max(1000),
  kioskId:    z.string().trim().max(50).default('K-01'),
});

export const RedeemSchema = z.object({
  userId:   z.string().trim().min(2, 'userId required').max(50),
  rewardId: z.coerce.number().int().positive('rewardId required'),
  quantity: z.coerce.number().int().positive().max(99).default(1),
});

export const RewardCRUDSchema = z.object({
  rewardName:    z.string().trim().min(1).max(200),
  pointsCost:    z.coerce.number().int().nonnegative(),
  stockQuantity: z.coerce.number().int().nonnegative().default(0),
  description:   z.string().trim().max(2000).optional().or(z.literal('')),
  category:      z.string().trim().max(100).optional().default('Eco Essentials'),
  icon:          z.string().trim().max(100).optional().default('🎁'),
  isSeasonal:    z.union([z.boolean(), z.literal(0), z.literal(1)]).optional().default(0),
  status:        z.string().trim().max(20).optional().default('active'),
});

export function validateBody(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      const issues = (err?.issues || []).map(i => `${i.path.join('.')} ${i.message}`).join('; ');
      return res.status(400).json({ error: `Invalid input: ${issues || 'Validation failed'}` });
    }
  };
}
