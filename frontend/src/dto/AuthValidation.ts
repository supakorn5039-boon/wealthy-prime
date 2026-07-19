import { z } from 'zod'

const PHONE_MAX_LENGTH = 15
const PHONE_MAX_MESSAGE = 'เบอร์โทรไม่เกิน 15 ตัวอักษร'

export const phoneSchema = z
  .string()
  .min(1, 'กรุณากรอกเบอร์โทร')
  .max(PHONE_MAX_LENGTH, PHONE_MAX_MESSAGE)

export const optionalPhoneSchema = z.string().max(PHONE_MAX_LENGTH, PHONE_MAX_MESSAGE).optional()

export const requiredLoosePhoneSchema = z
  .string()
  .min(1, 'กรุณากรอกเบอร์โทร')
  .max(PHONE_MAX_LENGTH, PHONE_MAX_MESSAGE)

export const loginSchema = z.object({
  email: z.string().email('อีเมลไม่ถูกต้อง'),
  password: z.string().min(6, 'รหัสผ่านอย่างน้อย 6 ตัวอักษร'),
})
export type LoginSchema = z.infer<typeof loginSchema>

export const registerSchema = z.object({
  firstName: z.string().min(1, 'กรุณากรอกชื่อ'),
  lastName: z.string().min(1, 'กรุณากรอกนามสกุล'),
  email: z.string().email('อีเมลไม่ถูกต้อง'),
  password: z.string().min(6, 'รหัสผ่านอย่างน้อย 6 ตัวอักษร'),
  phone: phoneSchema,
  secondaryPhone: optionalPhoneSchema,
  lineId: z.string().optional(),
  facebook: z.string().optional(),
  wechat: z.string().optional(),
  whatsapp: z.string().optional(),
  role: z.enum(['user', 'agent']),
})
export type RegisterSchema = z.infer<typeof registerSchema>

export const forgotPasswordSchema = z.object({
  email: z.string().email('อีเมลไม่ถูกต้อง'),
})
export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>

export const resetPasswordSchema = z
  .object({
    newPassword: z.string().min(6, 'รหัสผ่านอย่างน้อย 6 ตัวอักษร'),
    confirmPassword: z.string().min(6, 'รหัสผ่านอย่างน้อย 6 ตัวอักษร'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'รหัสผ่านไม่ตรงกัน',
    path: ['confirmPassword'],
  })
export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>

export const profileSchema = z.object({
  firstName: z.string().min(1, 'กรุณากรอกชื่อ'),
  lastName: z.string().min(1, 'กรุณากรอกนามสกุล'),
  email: z.string().email('อีเมลไม่ถูกต้อง'),
  phone: phoneSchema,
  secondaryPhone: optionalPhoneSchema,
  lineId: z.string().optional(),
  facebook: z.string().optional(),
  wechat: z.string().optional(),
  whatsapp: z.string().optional(),
})
export type ProfileSchema = z.infer<typeof profileSchema>
