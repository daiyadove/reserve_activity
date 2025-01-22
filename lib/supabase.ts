import { createClient } from '@supabase/supabase-js'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export type Database = {
  public: {
    Tables: {
      customers: {
        Row: {
          customer_id: string
          name: string
          email: string
          phone_number: string | null
        }
        Insert: {
          customer_id?: string
          name: string
          email: string
          phone_number?: string | null
        }
        Update: {
          customer_id?: string
          name?: string
          email?: string
          phone_number?: string | null
        }
      }
      slots: {
        Row: {
          slot_id: string
          start_time: string
          end_time: string
          capacity: number
          is_sold_out: boolean
        }
        Insert: {
          slot_id?: string
          start_time: string
          end_time: string
          capacity: number
          is_sold_out?: boolean
        }
        Update: {
          slot_id?: string
          start_time?: string
          end_time?: string
          capacity?: number
          is_sold_out?: boolean
        }
      }
      reservations: {
        Row: {
          reservation_id: string
          customer_id: string
          slot_id: string
          number_of_people: number
          reservation_date: string
        }
        Insert: {
          reservation_id?: string
          customer_id: string
          slot_id: string
          number_of_people: number
          reservation_date?: string
        }
        Update: {
          reservation_id?: string
          customer_id?: string
          slot_id?: string
          number_of_people?: number
          reservation_date?: string
        }
      }
      sold_out_settings: {
        Row: {
          sold_out_id: string
          slot_id: string
          sold_out_date: string
        }
        Insert: {
          sold_out_id?: string
          slot_id: string
          sold_out_date: string
        }
        Update: {
          sold_out_id?: string
          slot_id?: string
          sold_out_date?: string
        }
      }
      system_logs: {
        Row: {
          log_id: string
          log_level: string
          log_message: string
          log_time: string
        }
        Insert: {
          log_id?: string
          log_level: string
          log_message: string
          log_time?: string
        }
        Update: {
          log_id?: string
          log_level?: string
          log_message?: string
          log_time?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// クライアントコンポーネント用のクライアント
export const createClientSupabaseClient = () =>
  createClientComponentClient<Database>()

// 従来のクライアント（必要な場合のみ使用）
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]