import { z } from 'zod'
import { isValidPhoneNumber } from 'libphonenumber-js'

// Registration / profile phones flow through PhoneInput which yields E.164.
// Validation delegates to libphonenumber so any country works, not just TH.
export const phoneSchema = z
  .string()
  .min(1, 'กรุณากรอกเบอร์โทร')
  .refine((v) => isValidPhoneNumber(v), 'รูปแบบเบอร์โทรไม่ถูกต้อง')

// Permissive variant for legacy plain-text phone fields (e.g. property owner
// phone on the Add/Edit Property form). Accepts E.164 ("+66...") or a Thai
// local number ("0812345678") so existing flows keep working until they are
// also migrated to the picker.
const stripPhone = (v: string) => v.replace(/[\s-]/g, '')
const isLooseValidPhone = (v: string) => {
  const cleaned = stripPhone(v)
  if (/^0\d{8,9}$/.test(cleaned)) return true
  return isValidPhoneNumber(cleaned)
}
export const optionalPhoneSchema = z
  .string()
  .optional()
  .refine((v) => !v || isLooseValidPhone(v), 'รูปแบบเบอร์โทรไม่ถูกต้อง')

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
