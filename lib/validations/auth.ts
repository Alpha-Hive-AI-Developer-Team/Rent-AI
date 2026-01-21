import { z } from "zod";

export const signUpSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(30, "First name is too long"),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(30, "Last name is too long"),
  email: z.string().email("Invalid email format"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[@$!%*?&]/, "Password must contain at least one special character"),
  role: z.string().default("landlord"),
  referralCode: z.string().trim().min(1, "Invalid referral code").max(20).optional(),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
