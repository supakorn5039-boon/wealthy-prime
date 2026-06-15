import { z } from 'zod'

// Thai mobile phone: 9-10 digits total, leading 0.
// Accepts dashes/spaces in input ("081-111-1111", "081 111 1111", "0811111111")
// — we strip them before validation. Rejects all-zero placeholder values.
const stripPhone = (v: string) => v.replace(/[\s-]/g, '')
const isValidPhone = (v: string) => /^0\d{8,9}$/.test(stripPhone(v))
const isNotAllZeros = (v: string) => !/^0+$/.test(stripPhone(v))

export const phoneSchema = z
  .string()
  .min(1, 'กรุณากรอกเบอร์โทร')
  .refine(isValidPhone, 'รูปแบบเบอร์โทรไม่ถูกต้อง')
  .refine(isNotAllZeros, 'กรุณากรอกเบอร์จริง')

export const optionalPhoneSchema = z
  .string()
  .optional()
  .refine((v) => !v || isValidPhone(v), 'รูปแบบเบอร์โทรไม่ถูกต้อง')
  .refine((v) => !v || isNotAllZeros(v), 'กรุณากรอกเบอร์จริง')

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
