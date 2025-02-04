"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ReservationForm } from "@/components/reservation-form"
import { DailyTimeSlot, MenuItem } from "@/types/reservation"
import { createClientSupabaseClient } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

type ReservationStep = "menu" | "date_time" | "form"

export default function HomePage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [dailySlots, setDailySlots] = useState<DailyTimeSlot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<DailyTimeSlot | null>(null)
  const [selectedMenu, setSelectedMenu] = useState<MenuItem | null>(null)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [currentStep, setCurrentStep] = useState<ReservationStep>("menu")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const supabase = createClientSupabaseClient()

  // メニュー一覧を取得
  useEffect(() => {
    const fetchMenuItems = async () => {
      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .order("price")

      if (error) {
        toast({
          title: "エラーが発生しました",
          description: "メニューの取得に失敗しました",
          variant: "destructive",
        })
        return
      }

      setMenuItems(data)
    }

    fetchMenuItems()
  }, [toast])

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
      const reservationCounts = reservations?.reduce((acc: Record<string, number>, curr: { slot_id: string; number_of_people: number }) => {
        acc[curr.slot_id] = (acc[curr.slot_id] || 0) + curr.number_of_people
        return acc
      }, {} as Record<string, number>) || {}

      // 売止設定のslot_idセットを作成
      const soldOutSlotIds = new Set(soldOutSettings?.map((s: { slot_id: string }) => s.slot_id) || [])

      // 日付と時間枠を組み合わせた情報を作成
      const dailyTimeSlots = timeSlots?.map((slot: { slot_id: string; capacity: number; start_time: string; end_time: string }) => ({
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

  // メニューが選択された時の処理
  const handleMenuSelect = (menu: MenuItem) => {
    setSelectedMenu(menu)
    setCurrentStep("date_time")
  }

  // 時間枠が選択された時の処理
  const handleSlotSelect = (slot: DailyTimeSlot) => {
    setSelectedSlot(slot)
    setCurrentStep("form")
  }

  // 予約完了時の処理
  const handleReservationSuccess = () => {
    setSelectedSlot(null)
    setSelectedMenu(null)
    setCurrentStep("menu")
    if (selectedDate) {
      fetchDailySlots(selectedDate)
    }
  }

  // 戻るボタンの処理
  const handleBack = () => {
    if (currentStep === "date_time") {
      setCurrentStep("menu")
      setSelectedMenu(null)
    } else if (currentStep === "form") {
      setCurrentStep("date_time")
      setSelectedSlot(null)
    }
  }

  // 日時選択画面を表示
  if (currentStep === "date_time" && selectedMenu) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">日時を選択</h1>
          <Button variant="outline" onClick={handleBack}>
            メニュー選択に戻る
          </Button>
        </div>

        <div className="mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                {selectedMenu.image_url && (
                  <div className="w-24 h-24 relative rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={selectedMenu.image_url}
                      alt={selectedMenu.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-bold mb-2">{selectedMenu.name}</h2>
                  <p className="text-muted-foreground mb-2">{selectedMenu.description}</p>
                  <div className="flex items-center space-x-4">
                    <p className="text-sm">
                      <span className="font-medium">所要時間:</span> {selectedMenu.duration}分
                    </p>
                    <p className="text-lg font-bold">
                      ¥{selectedMenu.price.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* カレンダー */}
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

          {/* 時間枠一覧 */}
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
                        onClick={() => !slot.is_sold_out && handleSlotSelect(slot)}
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
    )
  }

  // メニュー選択画面を表示
  if (currentStep === "menu") {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-8">メニューを選択</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((menu) => (
            <Card
              key={menu.menu_id}
              className="cursor-pointer hover:bg-accent transition-colors"
              onClick={() => handleMenuSelect(menu)}
            >
              <div className="aspect-video relative">
                {menu.image_url ? (
                  <Image
                    src={menu.image_url}
                    alt={menu.name}
                    fill
                    className="object-cover rounded-t-lg"
                  />
                ) : (
                  <div className="absolute inset-0 bg-muted flex items-center justify-center rounded-t-lg">
                    <div className="text-muted-foreground text-center p-4">
                      <p className="text-lg font-medium">{menu.name}</p>
                      <p className="text-sm">{menu.duration}分</p>
                    </div>
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="font-medium mb-1">{menu.name}</h3>
                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                  {menu.description}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {menu.duration}分
                  </span>
                  <span className="font-bold">
                    ¥{menu.price.toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // 予約フォームダイアログ
  return (
    <Dialog 
      open={currentStep === "form" && selectedSlot !== null && selectedMenu !== null} 
      onOpenChange={() => currentStep === "form" && handleBack()}
    >
      {selectedSlot && selectedMenu && (
        <DialogContent>
          <DialogHeader>
            <DialogTitle>予約フォーム</DialogTitle>
          </DialogHeader>
          <ReservationForm
            slot={selectedSlot}
            menu={selectedMenu}
            onSuccess={handleReservationSuccess}
            onCancel={handleBack}
          />
        </DialogContent>
      )}
    </Dialog>
  )
}
