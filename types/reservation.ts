export interface TimeSlot {
  slot_id: string
  start_time: string // HH:mm:ss形式の時刻
  end_time: string // HH:mm:ss形式の時刻
  capacity: number
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
  reservation_date: string
  number_of_people: number
  customers?: Customer
  time_slot?: TimeSlot
}

export interface ReservationFormData {
  name: string
  email: string
  phone_number: string
  number_of_people: number
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