import { z } from 'zod'

export const reviewSchema = z.object({
  rating: z.number({ required_error: 'กรุณาให้คะแนน' }).min(1, 'กรุณาให้คะแนน').max(5),
  comment: z.string().max(1000, 'ความคิดเห็นไม่เกิน 1000 ตัวอักษร').optional(),
})
export type ReviewSchema = z.infer<typeof reviewSchema>

export const agentNoteSchema = z.object({
  note: z.string().max(500, 'โน้ตไม่เกิน 500 ตัวอักษร').optional(),
})
export type AgentNoteSchema = z.infer<typeof agentNoteSchema>
