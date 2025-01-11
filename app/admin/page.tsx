"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"

interface DashboardStats {
  totalReservations: number
  todayReservations: number
  totalTimeSlots: number
  soldOutSlots: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalReservations: 0,
    todayReservations: 0,
    totalTimeSlots: 0,
    soldOutSlots: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        // 総予約数を取得
        const { count: totalReservations } = await supabase
          .from("reservations")
          .select("*", { count: "exact" })

        // 本日の予約数を取得
        const { count: todayReservations } = await supabase
          .from("reservations")
          .select("*", { count: "exact" })
          .eq("reservation_date", format(today, "yyyy-MM-dd"))

        // 時間枠の総数を取得
        const { count: totalTimeSlots } = await supabase
          .from("time_slots")
          .select("*", { count: "exact" })

        // 本日の売止数を取得
        const { count: soldOutSlots } = await supabase
          .from("sold_out_settings")
          .select("*", { count: "exact" })
          .eq("date", format(today, "yyyy-MM-dd"))

        setStats({
          totalReservations: totalReservations || 0,
          todayReservations: todayReservations || 0,
          totalTimeSlots: totalTimeSlots || 0,
          soldOutSlots: soldOutSlots || 0,
        })
      } catch (error) {
        console.error("Error fetching stats:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">ダッシュボード</h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総予約数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReservations}件</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">本日の予約数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayReservations}件</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">時間枠数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTimeSlots}枠</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">本日の売止数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.soldOutSlots}枠</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}