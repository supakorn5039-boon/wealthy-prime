import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('อีเมลไม่ถูกต้อง'),
  password: z.string().min(6, 'รหัสผ่านอย่างน้อย 6 ตัวอักษร'),
})
export type LoginSchema = z.infer<typeof loginSchema>

export const registerSchema = z.object({
  name: z.string().min(1, 'กรุณากรอกชื่อ'),
  email: z.string().email('อีเมลไม่ถูกต้อง'),
  password: z.string().min(6, 'รหัสผ่านอย่างน้อย 6 ตัวอักษร'),
  phone: z.string().min(1, 'กรุณากรอกเบอร์โทร'),
  role: z.enum(['user', 'agent']),
})
export type RegisterSchema = z.infer<typeof registerSchema>
