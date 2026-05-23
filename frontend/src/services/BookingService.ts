import { fetchClient } from '@/utils/axios'
import { API } from '@/constants/ApiRoutes'
import type { Booking, CreateBookingPayload } from '@/types/Booking'
import type { ApiResponse } from '@/types/Commons'

const IS_MOCK = import.meta.env.VITE_MOCK_API === 'true'

export const BookingService = {
  QUERY_KEYS: {
    LIST: 'bookings',
    DETAIL: 'booking-detail',
  },

  create: async (payload: CreateBookingPayload): Promise<Booking> => {
    if (IS_MOCK) {
      const { MOCK_PROPERTIES, MOCK_USER, mockStore } = await import('@/mocks/data')
      const property = MOCK_PROPERTIES.find(p => p.id === payload.propertyId)
      const newBooking: Booking = {
        id: Date.now(),
        userId: MOCK_USER.id,
        userName: MOCK_USER.name,
        userPhone: MOCK_USER.phone,
        propertyId: payload.propertyId,
        propertyTitle: property?.title ?? 'Unknown',
        appointmentDate: payload.appointmentDate,
        note: payload.note,
        status: 'pending',
        createdAt: new Date().toISOString(),
      }
      mockStore.addBooking(newBooking)
      return newBooking
    }
    const res = await fetchClient.post<ApiResponse<Booking>>(API.BOOKINGS, payload)
    return res.data.data
  },

  list: async (): Promise<Booking[]> => {
    if (IS_MOCK) {
      const { mockStore } = await import('@/mocks/data')
      return mockStore.getBookings()
    }
    const res = await fetchClient.get<ApiResponse<Booking[]>>(API.BOOKINGS)
    return res.data.data
  },

  detail: async (id: number | string): Promise<Booking> => {
    if (IS_MOCK) {
      const { mockStore } = await import('@/mocks/data')
      const b = mockStore.getBookings().find(x => x.id === Number(id))
      if (!b) throw new Error('Booking not found')
      return b
    }
    const res = await fetchClient.get<ApiResponse<Booking>>(API.BOOKING_DETAIL(id))
    return res.data.data
  },

  cancel: async (id: number | string): Promise<void> => {
    if (IS_MOCK) {
      const { mockStore } = await import('@/mocks/data')
      mockStore.cancelBooking(Number(id))
      return
    }
    await fetchClient.patch(API.BOOKING_DETAIL(id), { status: 'cancelled' })
  },
}
