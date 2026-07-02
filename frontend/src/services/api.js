import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.detail || 'Something went wrong. Please try again.'
    return Promise.reject(new Error(message))
  }
)

export const authApi = {
  login: (pnr, lastName) => api.post('/api/auth/login', { pnr, last_name: lastName }).then((r) => r.data),
}

export const bookingApi = {
  get: (bookingId) => api.get('/api/booking', { params: { booking_id: bookingId } }).then((r) => r.data),
}

export const flightApi = {
  status: (bookingId) => api.get('/api/flight-status', { params: { booking_id: bookingId } }).then((r) => r.data),
}

export const rebookApi = {
  alternates: (bookingId) => api.get('/api/alternate-flights', { params: { booking_id: bookingId } }).then((r) => r.data),
  rebook: (bookingId, newFlightId) => api.post('/api/rebook', { booking_id: bookingId, new_flight_id: newFlightId }).then((r) => r.data),
}

export const refundApi = {
  eligibility: (bookingId) => api.get('/api/refund/eligibility', { params: { booking_id: bookingId } }).then((r) => r.data),
  request: (bookingId, refundType, reason) => api.post('/api/refund', { booking_id: bookingId, refund_type: refundType, reason }).then((r) => r.data),
}

export const chatApi = {
  send: (bookingId, message, language = 'en') =>
    api.post('/api/chat', { booking_id: bookingId, message, language }).then((r) => r.data),
}

export const notificationsApi = {
  list: (bookingId) => api.get('/api/notifications', { params: { booking_id: bookingId } }).then((r) => r.data),
  listSince: (bookingId, since) =>
    api.get('/api/notifications', { params: { booking_id: bookingId, since } }).then((r) => r.data),
}

export const profileApi = {
  get: (bookingId) => api.get('/api/profile', { params: { booking_id: bookingId } }).then((r) => r.data),
  update: (bookingId, data) => api.patch('/api/profile', { booking_id: bookingId, ...data }).then((r) => r.data),
}

export const journeyApi = {
  get: (bookingId) => api.get('/api/journey', { params: { booking_id: bookingId } }).then((r) => r.data),
}

export const vouchersApi = {
  list: (bookingId) => api.get('/api/vouchers', { params: { booking_id: bookingId } }).then((r) => r.data),
  redeem: (voucherId) => api.post(`/api/vouchers/${voucherId}/redeem`).then((r) => r.data),
}

export const baggageApi = {
  list: (bookingId) => api.get('/api/baggage', { params: { booking_id: bookingId } }).then((r) => r.data),
}

export const boardingPassApi = {
  get: (bookingId) => api.get('/api/boarding-pass', { params: { booking_id: bookingId } }).then((r) => r.data),
  scan: (bookingId, gateCode) =>
    api.post('/api/boarding-pass/scan', { booking_id: bookingId, gate_code: gateCode }).then((r) => r.data),
}

export const groupApi = {
  get: (masterPnr) => api.get('/api/group', { params: { master_pnr: masterPnr } }).then((r) => r.data),
  rebook: (masterPnr, newFlightId, bookingIds) =>
    api.post('/api/group/rebook', { master_pnr: masterPnr, new_flight_id: newFlightId, booking_ids: bookingIds }).then((r) => r.data),
  refund: (masterPnr, bookingIds, refundType) =>
    api.post('/api/group/refund', { master_pnr: masterPnr, booking_ids: bookingIds, refund_type: refundType }).then((r) => r.data),
}

export const analyticsApi = {
  summary: () => api.get('/api/analytics/summary').then((r) => r.data),
}
