import { fetchClient } from '@/utils/axios'
import { API } from '@/constants/ApiRoutes'
import type { Booking, CreateBookingPayload } from '@/types/Booking'
import type { ApiResponse } from '@/types/Commons'

export const BookingService = {
  QUERY_KEYS: {
    LIST: 'bookings',
    DETAIL: 'booking-detail',
  },

  create: async (payload: CreateBookingPayload): Promise<Booking> => {
    const body = {
      property_ids: [payload.propertyId],
      appointment_date: payload.appointmentDate,
      note: payload.note,
      firstName: payload.firstName,
      lastName: payload.lastName,
      phone: payload.phone,
      secondaryPhone: payload.secondaryPhone,
      latestContact: payload.latestContact,
      lineId: payload.lineId,
      email: payload.email,
      facebook: payload.facebook,
      wechat: payload.wechat,
      whatsapp: payload.whatsapp,
    }
    const res = await fetchClient.post<ApiResponse<Booking[]>>(API.BOOKINGS, body)
    return res.data.data[0]
  },

  list: async (): Promise<Booking[]> => {
    const res = await fetchClient.get<ApiResponse<Booking[]>>(API.BOOKINGS)
    return res.data.data
  },

  detail: async (id: number | string): Promise<Booking> => {
    const res = await fetchClient.get<ApiResponse<Booking>>(API.BOOKING_DETAIL(id))
    return res.data.data
  },

  cancel: async (id: number | string): Promise<void> => {
    await fetchClient.put(API.BOOKING_DETAIL(id), { status: 'cancelled' })
  },
}
