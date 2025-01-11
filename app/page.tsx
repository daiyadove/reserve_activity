"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ReservationForm } from "@/components/reservation-form"
import { TimeSlot, DailyTimeSlot } from "@/types/reservation"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

export default function HomePage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [dailySlots, setDailySlots] = useState<DailyTimeSlot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<DailyTimeSlot | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // 選択された日付の予約枠を取得
  const fetchDailySlots = async (date: Date) => {
    try {
      setIsLoading(true)
      
      // 時間枠を取得
      const { data: timeSlots, error: timeSlotsError } = await supabase
        .from("time_slots")
        .select("*")
        .order("start_time")

      if (timeSlotsError) {
        throw new Error("予約枠の取得に失敗しました")
      }

      // 選択された日付の売止設定を取得
      const { data: soldOutSettings, error: soldOutError } = await supabase
        .from("sold_out_settings")
        .select("slot_id")
        .eq("date", format(date, "yyyy-MM-dd"))

      if (soldOutError) {
        throw new Error("売止設定の取得に失敗しました")
      }

      // 選択された日付の予約を取得して残り定員を計算
      const { data: reservations, error: reservationsError } = await supabase
        .from("reservations")
        .select("slot_id, number_of_people")
        .eq("reservation_date", format(date, "yyyy-MM-dd"))

      if (reservationsError) {
        throw new Error("予約情報の取得に失敗しました")
      }

      // 予約枠ごとの予約人数を集計
      const reservationCounts = reservations?.reduce((acc, curr) => {
        acc[curr.slot_id] = (acc[curr.slot_id] || 0) + curr.number_of_people
        return acc
      }, {} as Record<string, number>) || {}

      // 売止設定のslot_idセットを作成
      const soldOutSlotIds = new Set(soldOutSettings?.map(s => s.slot_id) || [])

      // 日付と時間枠を組み合わせた情報を作成
      const dailyTimeSlots = timeSlots?.map(slot => ({
        ...slot,
        date: format(date, "yyyy-MM-dd"),
        is_sold_out: soldOutSlotIds.has(slot.slot_id),
        available_capacity: slot.capacity - (reservationCounts[slot.slot_id] || 0)
      })) || []

      setDailySlots(dailyTimeSlots)
    } catch (error) {
      const message = error instanceof Error ? error.message : "予約枠の取得に失敗しました"
      toast({
        title: "エラーが発生しました",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 初期データの読み込み
  useEffect(() => {
    if (selectedDate) {
      fetchDailySlots(selectedDate)
    }
  }, [selectedDate])

  // 日付が選択された時の処理
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">予約システム</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* カレンダー */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>日付を選択</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                locale={ja}
                disabled={(date) => date < new Date()}
              />
            </CardContent>
          </Card>
        </div>

        {/* 予約枠一覧 */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedDate
                  ? format(selectedDate, "M月d日", { locale: ja }) + "の予約枠"
                  : "予約枠"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {isLoading ? (
                  <p className="text-muted-foreground">読み込み中...</p>
                ) : dailySlots.length === 0 ? (
                  <p className="text-muted-foreground">
                    予約可能な枠がありません
                  </p>
                ) : (
                  dailySlots.map((slot) => (
                    <Card key={slot.slot_id} className="cursor-pointer hover:bg-accent">
                      <CardContent
                        className="p-4"
                        onClick={() => !slot.is_sold_out && setSelectedSlot(slot)}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">
                              {format(new Date(`2000-01-01T${slot.start_time}`), "H:mm", {
                                locale: ja,
                              })}
                              {" - "}
                              {format(new Date(`2000-01-01T${slot.end_time}`), "H:mm", {
                                locale: ja,
                              })}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              残り{slot.available_capacity}名
                            </p>
                          </div>
                          {slot.is_sold_out ? (
                            <span className="text-destructive font-medium">
                              売止
                            </span>
                          ) : (
                            <span className="text-primary font-medium">
                              予約可能
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 予約フォームダイアログ */}
      <Dialog open={selectedSlot !== null} onOpenChange={() => setSelectedSlot(null)}>
        {selectedSlot && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>予約フォーム</DialogTitle>
            </DialogHeader>
            <ReservationForm
              slot={selectedSlot}
              onSuccess={() => {
                setSelectedSlot(null)
                if (selectedDate) {
                  fetchDailySlots(selectedDate)
                }
              }}
              onCancel={() => setSelectedSlot(null)}
            />
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}
