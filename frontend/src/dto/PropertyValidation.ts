import { z } from 'zod'
import { optionalPhoneSchema } from '@/dto/AuthValidation'

export const propertySchema = z
  .object({
    projectName: z.string().min(1, 'กรุณากรอกชื่อโครงการ'),
    location: z.string().optional(),
    price: z.string().min(1, 'กรุณากรอกราคา'),
    sizeSqm: z.string().optional(),
    ownerInfo: z.string().optional(),
    ownerExtraDetail: z.string().optional(),
    lat: z.string().optional(),
    lng: z.string().optional(),

    kind: z.enum(['condo', 'house', 'townhouse', 'land', 'commercial'] as const, {
      required_error: 'กรุณาเลือกประเภททรัพย์',
    }),
    listing: z.enum(['rent', 'sell', 'both'] as const, {
      required_error: 'กรุณาเลือกประเภทรายการ',
    }),
    province: z.string().min(1, 'กรุณาเลือกจังหวัด'),
    district: z.string().min(1, 'กรุณาเลือกเขต'),
    googleMapUrl: z.string().optional(),
    btsMrt: z.string().optional(),
    bedrooms: z.string().optional(),
    bathrooms: z.string().optional(),
    floor: z.string().optional(),
    minContract: z.string().optional(),
    pets: z.enum(['allowed', 'not_allowed', ''] as const).optional(),
    furniture: z.enum(['full', 'partial', 'none', ''] as const).optional(),
    adCaption: z.string().optional(),

    ownerName: z.string().optional(),
    ownerPhone: optionalPhoneSchema,
    ownerLineId: z.string().optional(),
    ownerEmail: z
      .string()
      .optional()
      .refine((v) => !v || /\S+@\S+\.\S+/.test(v), 'อีเมลไม่ถูกต้อง'),
    ownerFacebook: z.string().optional(),
    ownerWechat: z.string().optional(),
    ownerWhatsapp: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const price = Number(data.price)
    if (isNaN(price) || price <= 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'ราคาต้องมากกว่า 0', path: ['price'] })
    }
    if (data.sizeSqm) {
      const size = Number(data.sizeSqm)
      if (isNaN(size) || size <= 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'พื้นที่ต้องมากกว่า 0', path: ['sizeSqm'] })
      }
    }
    const hasLat = !!data.lat
    const hasLng = !!data.lng
    if (hasLat !== hasLng) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'กรุณากรอกทั้ง lat และ lng', path: [hasLat ? 'lng' : 'lat'] })
    }
    if (hasLat) {
      const lat = Number(data.lat)
      if (isNaN(lat) || lat < -90 || lat > 90) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'lat ต้องอยู่ระหว่าง -90 ถึง 90', path: ['lat'] })
      }
    }
    if (hasLng) {
      const lng = Number(data.lng)
      if (isNaN(lng) || lng < -180 || lng > 180) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'lng ต้องอยู่ระหว่าง -180 ถึง 180', path: ['lng'] })
      }
    }
    const positiveIntOptional = (name: keyof typeof data, label: string) => {
      const v = data[name] as string | undefined
      if (!v) return
      const n = Number(v)
      if (isNaN(n) || n < 0 || !Number.isInteger(n)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${label}ต้องเป็นจำนวนเต็มไม่ติดลบ`, path: [name as string] })
      }
    }
    positiveIntOptional('bedrooms', 'จำนวนห้องนอน')
    positiveIntOptional('bathrooms', 'จำนวนห้องน้ำ')
    positiveIntOptional('floor', 'ชั้น')
    positiveIntOptional('minContract', 'สัญญาขั้นต่ำ')
  })

export type PropertySchema = z.infer<typeof propertySchema>

export const propertyStatusSchema = z.object({
  status: z.enum([
    'available',
    'reserved',
    'sold',
    'unavailable',
    'owner_update',
  ] as const),
})
export type PropertyStatusSchema = z.infer<typeof propertyStatusSchema>
