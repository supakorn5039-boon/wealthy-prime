import { z } from 'zod'

export const bookingSchema = z.object({
  propertyId: z.number(),
  appointmentDate: z.string().min(1, 'กรุณาเลือกวันและเวลานัดหมาย'),
  note: z.string().optional(),
})
export type BookingSchema = z.infer<typeof bookingSchema>
