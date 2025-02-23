export interface TimeSlot {
  slot_id: string
  start_time: string // HH:mm:ss形式の時刻
  end_time: string // HH:mm:ss形式の時刻
  capacity: number
}

export interface MenuItem {
  menu_id: string
  name: string
  description: string
  duration: number
  price: number
  image_url: string | null
}

export interface Customer {
  customer_id: string
  name: string
  email: string
  phone_number: string | null
}

export interface Reservation {
  reservation_id: string
  customer_id: string
  slot_id: string
  menu_id: string
  reservation_date: string
  number_of_people: number
  customers?: Customer
  time_slot?: TimeSlot
  menu_item?: MenuItem
}

export interface ReservationFormData {
  name: string
  email: string
  phone_number: string
  number_of_people: number
  menu_id: string
}

export interface SoldOutSetting {
  sold_out_id: string
  slot_id: string
  date: string
}

// 日付と時間枠の組み合わせを表す型
export interface DailyTimeSlot extends TimeSlot {
  is_sold_out: boolean
  available_capacity: number
  date: string
}

export interface Coupon {
  coupon_id: string
  code: string
  name: string
  discount_percentage: number
  is_active: boolean
  created_at: string
  created_by?: string
}

export interface CouponUsage {
  usage_id: string
  coupon_id: string
  reservation_id: string
  used_at: string
  coupon?: Coupon
}

export interface ReservationWithCoupon extends Reservation {
  coupon_usage?: CouponUsage
}
