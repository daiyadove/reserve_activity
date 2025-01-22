import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from './supabase.js'

// サーバーコンポーネント用のクライアント
export const createServerSupabaseClient = () =>
  createServerComponentClient<Database>({ cookies })