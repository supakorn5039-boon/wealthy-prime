import { z } from 'zod'

export const propertySchema = z
  .object({
    title: z.string().min(1, 'กรุณากรอกชื่อทรัพย์'),
    projectName: z.string().min(1, 'กรุณากรอกชื่อโครงการ'),
    location: z.string().min(1, 'กรุณากรอกที่ตั้ง'),
    price: z.string().min(1, 'กรุณากรอกราคา'),
    type: z.enum(['buy', 'rent'] as const, { required_error: 'กรุณาเลือกประเภท' }),
    sizeSqm: z.string().optional(),
    ownerInfo: z.string().min(1, 'กรุณากรอกข้อมูลเจ้าของทรัพย์'),
    ownerExtraDetail: z.string().optional(),
    rentalPeriodMonths: z.string().optional(),
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
    if (data.rentalPeriodMonths) {
      const months = Number(data.rentalPeriodMonths)
      if (isNaN(months) || months <= 0 || !Number.isInteger(months)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'ระยะเวลาต้องเป็นจำนวนเต็มบวก', path: ['rentalPeriodMonths'] })
      }
    }
  })

export type PropertySchema = z.infer<typeof propertySchema>

export const propertyStatusSchema = z.object({
  status: z.enum(['available', 'pending_approve', 'reserved', 'sold'] as const),
  rentalPeriodMonths: z.string().optional(),
})
export type PropertyStatusSchema = z.infer<typeof propertyStatusSchema>
