import type { Property } from '@/types/Property'
import type { AuthUser } from '@/types/Auth'
import type { Booking } from '@/types/Booking'
import type { Review, ReviewLink } from '@/types/Review'
import type { AdminDashboardData, PendingApproval, FinancialRecord } from '@/services/AdminService'
import type { AgentDashboardStats } from '@/types/Property'
import type { ContactCase } from '@/services/AgentService'

export const MOCK_AGENT: AuthUser = {
  id: 10,
  name: 'สมชาย ใจดี',
  email: 'agent@wpe.com',
  phone: '0891234567',
  role: 'agent',
  createdAt: '2024-01-15T00:00:00Z',
}

export const MOCK_ADMIN: AuthUser = {
  id: 1,
  name: 'แอดมิน WPE',
  email: 'admin@wpe.com',
  phone: '0800000001',
  role: 'admin',
  createdAt: '2024-01-01T00:00:00Z',
}

export const MOCK_USER: AuthUser = {
  id: 20,
  name: 'สมหญิง รักบ้าน',
  email: 'user@wpe.com',
  phone: '0812345678',
  role: 'user',
  createdAt: '2024-03-10T00:00:00Z',
}

export const MOCK_PROPERTIES: Property[] = [
  {
    id: 1,
    title: 'คอนโด High Rise ใจกลางสุขุมวิท',
    projectName: 'The Sukhumvit Residences',
    location: 'สุขุมวิท กรุงเทพมหานคร',
    price: 4500000,
    type: 'buy',
    sizeSqm: 52,
    agentId: 10,
    agentName: 'สมชาย ใจดี',
    ownerInfo: 'คุณวิชัย มั่งมี 0891111111',
    status: 'available',
    images: [],
    rating: 4.7,
    reviewCount: 12,
    lat: 13.7375,
    lng: 100.5605,
    createdAt: '2024-06-01T00:00:00Z',
  },
  {
    id: 2,
    title: 'บ้านเดี่ยว 2 ชั้น หมู่บ้าน The Grand',
    projectName: 'The Grand Village',
    location: 'ลาดพร้าว กรุงเทพมหานคร',
    price: 8900000,
    type: 'buy',
    sizeSqm: 180,
    agentId: 10,
    agentName: 'สมชาย ใจดี',
    ownerInfo: 'คุณสุภา รวยทรัพย์ 0892222222',
    status: 'available',
    images: [],
    rating: 4.5,
    reviewCount: 7,
    lat: 13.7953,
    lng: 100.5742,
    createdAt: '2024-06-10T00:00:00Z',
  },
  {
    id: 3,
    title: 'ทาวน์โฮม 3 ชั้น ย่านพระราม 9',
    projectName: 'Rama 9 Townhome',
    location: 'พระราม 9 กรุงเทพมหานคร',
    price: 3200000,
    type: 'buy',
    sizeSqm: 120,
    agentId: 10,
    agentName: 'สมชาย ใจดี',
    ownerInfo: 'คุณธนา พอใจ 0893333333',
    status: 'reserved',
    images: [],
    rating: 4.2,
    reviewCount: 4,
    lat: 13.7470,
    lng: 100.5699,
    createdAt: '2024-05-20T00:00:00Z',
  },
  {
    id: 4,
    title: 'คอนโดให้เช่า ใกล้ BTS อ่อนนุช',
    projectName: 'Onnut Condo Park',
    location: 'อ่อนนุช กรุงเทพมหานคร',
    price: 18000,
    type: 'rent',
    sizeSqm: 35,
    agentId: 10,
    agentName: 'สมชาย ใจดี',
    ownerInfo: 'คุณมาลี รักเช่า 0894444444',
    rentalPeriodMonths: 12,
    status: 'available',
    images: [],
    rating: 4.0,
    reviewCount: 9,
    lat: 13.6999,
    lng: 100.5909,
    createdAt: '2024-07-01T00:00:00Z',
  },
  {
    id: 5,
    title: 'อพาร์ตเมนต์ย่านสีลม พร้อมเฟอร์นิเจอร์',
    projectName: 'Silom Avenue Apartments',
    location: 'สีลม กรุงเทพมหานคร',
    price: 25000,
    type: 'rent',
    sizeSqm: 48,
    agentId: 10,
    agentName: 'สมชาย ใจดี',
    ownerInfo: 'คุณจิรา สุขสบาย 0895555555',
    rentalPeriodMonths: 6,
    status: 'available',
    images: [],
    rating: 4.8,
    reviewCount: 21,
    lat: 13.7266,
    lng: 100.5333,
    createdAt: '2024-04-15T00:00:00Z',
  },
  {
    id: 6,
    title: 'บ้านแฝด ย่านบางนา ใกล้ IKEA',
    projectName: 'Bangna Twin House',
    location: 'บางนา กรุงเทพมหานคร',
    price: 5600000,
    type: 'buy',
    sizeSqm: 150,
    agentId: 10,
    agentName: 'สมชาย ใจดี',
    ownerInfo: 'คุณประยุทธ์ มีบ้าน 0896666666',
    status: 'sold',
    images: [],
    rating: 4.3,
    reviewCount: 5,
    lat: 13.6759,
    lng: 100.6073,
    createdAt: '2024-03-01T00:00:00Z',
  },
  {
    id: 7,
    title: 'คอนโด Low Rise สไตล์ Loft ย่านทองหล่อ',
    projectName: 'Thonglor Loft Residences',
    location: 'ทองหล่อ กรุงเทพมหานคร',
    price: 6200000,
    type: 'buy',
    sizeSqm: 65,
    agentId: 10,
    agentName: 'สมชาย ใจดี',
    ownerInfo: 'คุณอรทัย สวยงาม 0897777777',
    status: 'available',
    images: [],
    rating: 4.9,
    reviewCount: 16,
    lat: 13.7311,
    lng: 100.5824,
    createdAt: '2024-07-15T00:00:00Z',
  },
  {
    id: 8,
    title: 'ห้องเช่าพักอาศัย ย่านรามคำแหง',
    projectName: 'Ramkhamhaeng Residence',
    location: 'รามคำแหง กรุงเทพมหานคร',
    price: 9000,
    type: 'rent',
    sizeSqm: 28,
    agentId: 10,
    agentName: 'สมชาย ใจดี',
    ownerInfo: 'คุณบัวแก้ว หาเช่า 0898888888',
    rentalPeriodMonths: 12,
    status: 'available',
    images: [],
    rating: 3.8,
    reviewCount: 3,
    lat: 13.7567,
    lng: 100.6298,
    createdAt: '2024-08-01T00:00:00Z',
  },
]

export const MOCK_REVIEWS: Record<number, Review[]> = {
  1: [
    { id: 1, propertyId: 1, userId: 20, userName: 'สมหญิง รักบ้าน', rating: 5, comment: 'คอนโดสวยมาก ทำเลดีเยี่ยม ใกล้รถไฟฟ้า', createdAt: '2024-07-01T00:00:00Z' },
    { id: 2, propertyId: 1, userId: 21, userName: 'ประภาส ดีใจ', rating: 4, comment: 'ห้องกว้าง วิวสวย ราคาพอสมควร', createdAt: '2024-07-10T00:00:00Z' },
  ],
  4: [
    { id: 3, propertyId: 4, userId: 20, userName: 'สมหญิง รักบ้าน', rating: 4, comment: 'เช่าแล้วสะดวกมาก ไปทำงานง่าย', createdAt: '2024-08-01T00:00:00Z' },
  ],
  5: [
    { id: 4, propertyId: 5, userId: 22, userName: 'วันเพ็ญ สุขดี', rating: 5, comment: 'ทำเลดีมาก ใกล้สถานีรถไฟ สะอาดมาก', createdAt: '2024-07-20T00:00:00Z' },
  ],
}

export const MOCK_BOOKINGS: Booking[] = [
  {
    id: 101,
    userId: 20,
    userName: 'สมหญิง รักบ้าน',
    userPhone: '0812345678',
    propertyId: 1,
    propertyTitle: 'คอนโด High Rise ใจกลางสุขุมวิท',
    appointmentDate: '2024-09-15T10:00:00Z',
    status: 'assigned',
    assignedAgentId: 10,
    assignedAgentName: 'สมชาย ใจดี',
    agentNote: 'ลูกค้าสนใจมาก นัดดูวันเสาร์',
    createdAt: '2024-09-01T00:00:00Z',
  },
  {
    id: 102,
    userId: 20,
    userName: 'สมหญิง รักบ้าน',
    userPhone: '0812345678',
    propertyId: 4,
    propertyTitle: 'คอนโดให้เช่า ใกล้ BTS อ่อนนุช',
    appointmentDate: '2024-09-20T14:00:00Z',
    status: 'pending',
    createdAt: '2024-09-05T00:00:00Z',
  },
]

export const MOCK_WISHLIST: Property[] = [MOCK_PROPERTIES[0], MOCK_PROPERTIES[4]]

export const MOCK_AGENT_CONTACTS: ContactCase[] = [
  {
    id: 101,
    userId: 20,
    userName: 'สมหญิง รักบ้าน',
    userPhone: '0812345678',
    userLineId: '@somying',
    propertyId: 1,
    propertyTitle: 'คอนโด High Rise ใจกลางสุขุมวิท',
    appointmentDate: '2024-09-15T10:00:00Z',
    status: 'assigned',
    assignedAgentId: 10,
    assignedAgentName: 'สมชาย ใจดี',
    agentNote: 'ลูกค้าสนใจมาก นัดดูวันเสาร์',
    createdAt: '2024-09-01T00:00:00Z',
  },
  {
    id: 103,
    userId: 23,
    userName: 'วิทยา ชอบบ้าน',
    userPhone: '0823456789',
    userLineId: '@wittaya',
    propertyId: 2,
    propertyTitle: 'บ้านเดี่ยว 2 ชั้น หมู่บ้าน The Grand',
    appointmentDate: '2024-09-25T13:00:00Z',
    status: 'assigned',
    assignedAgentId: 10,
    assignedAgentName: 'สมชาย ใจดี',
    agentNote: '',
    createdAt: '2024-09-10T00:00:00Z',
  },
]

export const MOCK_REVIEW_LINKS: ReviewLink[] = [
  {
    token: 'abc123token',
    url: `${window?.location?.origin ?? 'https://wpe.vercel.app'}/review/abc123token`,
    propertyId: 1,
    propertyTitle: 'คอนโด High Rise ใจกลางสุขุมวิท',
    expiresAt: '2024-12-31T23:59:59Z',
  },
]

export const MOCK_AGENT_DASHBOARD: AgentDashboardStats = {
  totalProperties: 8,
  reservedProperties: 1,
  availableProperties: 5,
}

export const MOCK_ADMIN_DASHBOARD: AdminDashboardData = {
  totalProperties: 8,
  totalUsers: 45,
  totalAgents: 6,
  totalRevenue: 2150000,
  propertyStatusChart: [
    { status: 'available', count: 5 },
    { status: 'reserved', count: 1 },
    { status: 'sold', count: 1 },
    { status: 'pending_approve', count: 1 },
  ],
  agentLeaderboard: [
    { agentId: 10, agentName: 'สมชาย ใจดี', closedCount: 4 },
    { agentId: 11, agentName: 'วรรณา สดใส', closedCount: 3 },
    { agentId: 12, agentName: 'กิตติ เก่งกาจ', closedCount: 2 },
  ],
}

export const MOCK_AGENTS: AuthUser[] = [
  { id: 10, name: 'สมชาย ใจดี', email: 'agent@wpe.com', phone: '0891234567', role: 'agent', createdAt: '2024-01-15T00:00:00Z' },
  { id: 11, name: 'วรรณา สดใส', email: 'wanna@wpe.com', phone: '0899876543', role: 'agent', createdAt: '2024-02-01T00:00:00Z' },
  { id: 12, name: 'กิตติ เก่งกาจ', email: 'kitti@wpe.com', phone: '0867654321', role: 'agent', createdAt: '2024-02-20T00:00:00Z' },
]

export const MOCK_USERS: AuthUser[] = [
  { id: 20, name: 'สมหญิง รักบ้าน', email: 'user@wpe.com', phone: '0812345678', role: 'user', createdAt: '2024-03-10T00:00:00Z' },
  { id: 21, name: 'ประภาส ดีใจ', email: 'prapas@email.com', phone: '0823456789', role: 'user', createdAt: '2024-04-05T00:00:00Z' },
  { id: 22, name: 'วันเพ็ญ สุขดี', email: 'wanpen@email.com', phone: '0834567890', role: 'user', createdAt: '2024-05-01T00:00:00Z' },
]

export const MOCK_PENDING: PendingApproval[] = [
  {
    id: 201,
    property: MOCK_PROPERTIES[2],
    requestedStatus: 'reserved',
    slipUrl: undefined,
    agentId: 10,
    agentName: 'สมชาย ใจดี',
    createdAt: '2024-09-12T00:00:00Z',
  },
]

export const MOCK_FINANCIAL: FinancialRecord[] = [
  { id: 301, propertyId: 6, propertyTitle: 'บ้านแฝด ย่านบางนา ใกล้ IKEA', agentName: 'สมชาย ใจดี', amount: 5600000, type: 'buy', closedAt: '2024-08-20T00:00:00Z' },
  { id: 302, propertyId: 3, propertyTitle: 'ทาวน์โฮม 3 ชั้น ย่านพระราม 9', agentName: 'วรรณา สดใส', amount: 250000, type: 'rent', closedAt: '2024-09-01T00:00:00Z' },
]

let _wishlist = [...MOCK_WISHLIST]
let _reviewLinks = [...MOCK_REVIEW_LINKS]
let _agentNotes: Record<number, string> = { 101: 'ลูกค้าสนใจมาก นัดดูวันเสาร์', 103: '' }
let _pending = [...MOCK_PENDING]
let _agents = [...MOCK_AGENTS]
let _users = [...MOCK_USERS]
let _bookings = [...MOCK_BOOKINGS]

export const mockStore = {
  getWishlist: () => _wishlist,
  addWishlist: (p: Property) => { if (!_wishlist.find(x => x.id === p.id)) _wishlist.push(p) },
  removeWishlist: (id: number) => { _wishlist = _wishlist.filter(x => x.id !== id) },

  getReviewLinks: () => _reviewLinks,
  addReviewLink: (link: ReviewLink) => { _reviewLinks.unshift(link) },

  getNote: (id: number) => _agentNotes[id] ?? '',
  setNote: (id: number, note: string) => { _agentNotes[id] = note },

  getPending: () => _pending,
  removePending: (id: number) => { _pending = _pending.filter(x => x.id !== id) },

  getAgents: () => _agents,
  updateAgent: (id: number, patch: Partial<AuthUser>) => {
    _agents = _agents.map(a => a.id === id ? { ...a, ...patch } : a)
    return _agents.find(a => a.id === id)!
  },

  getUsers: () => _users,
  updateUser: (id: number, patch: Partial<AuthUser>) => {
    _users = _users.map(u => u.id === id ? { ...u, ...patch } : u)
    return _users.find(u => u.id === id)!
  },

  getBookings: () => _bookings,
  addBooking: (b: Booking) => { _bookings.unshift(b) },
  cancelBooking: (id: number) => { _bookings = _bookings.map(b => b.id === id ? { ...b, status: 'cancelled' as const } : b) },
}
