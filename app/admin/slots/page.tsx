"use client"

import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SlotForm } from "@/components/slot-form"
import { supabase } from "@/lib/supabase"
import { TimeSlot } from "@/types/reservation"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"

export default function SlotsPage() {
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | undefined>(undefined)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [soldOutSlotIds, setSoldOutSlotIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // 予約枠一覧を取得
  const fetchSlots = async () => {
    try {
      const { data, error } = await supabase
        .from("time_slots")
        .select("*")
        .order("start_time")

      if (error) {
        throw new Error("予約枠の取得に失敗しました")
      }

      setSlots(data || [])
    } catch (error) {
      const message = error instanceof Error ? error.message : "予約枠の取得に失敗しました"
      toast({
        title: "エラーが発生しました",
        description: message,
        variant: "destructive",
      })
    }
  }

  // 売止設定を取得
  const fetchSoldOutSettings = async (date: Date) => {
    try {
      const { data, error } = await supabase
        .from("sold_out_settings")
        .select("slot_id")
        .eq("date", format(date, "yyyy-MM-dd"))

      if (error) {
        throw new Error("売止設定の取得に失敗しました")
      }

      setSoldOutSlotIds(new Set(data?.map(s => s.slot_id) || []))
    } catch (error) {
      const message = error instanceof Error ? error.message : "売止設定の取得に失敗しました"
      toast({
        title: "エラーが発生しました",
        description: message,
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    fetchSlots()
  }, [])

  useEffect(() => {
    fetchSoldOutSettings(selectedDate)
  }, [selectedDate])

  // 予約枠を削除
  const handleDelete = async (slotId: string) => {
    if (!confirm("この予約枠を削除してもよろしいですか？")) {
      return
    }

    try {
      setIsLoading(true)
      const { error } = await supabase
        .from("time_slots")
        .delete()
        .eq("slot_id", slotId)

      if (error) {
        throw new Error("予約枠の削除に失敗しました")
      }

      toast({
        title: "予約枠を削除しました",
      })
      fetchSlots()
    } catch (error) {
      const message = error instanceof Error ? error.message : "予約枠の削除に失敗しました"
      toast({
        title: "エラーが発生しました",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 売止設定を切り替え
  const handleToggleSoldOut = async (slot: TimeSlot) => {
    try {
      setIsLoading(true)
      const isSoldOut = soldOutSlotIds.has(slot.slot_id)

      if (isSoldOut) {
        // 売止解除
        const { error } = await supabase
          .from("sold_out_settings")
          .delete()
          .eq("slot_id", slot.slot_id)
          .eq("date", format(selectedDate, "yyyy-MM-dd"))

        if (error) {
          throw new Error("売止解除に失敗しました")
        }

        toast({
          title: "売止を解除しました",
        })
      } else {
        // 売止設定
        const { error } = await supabase
          .from("sold_out_settings")
          .insert({
            slot_id: slot.slot_id,
            date: format(selectedDate, "yyyy-MM-dd")
          })

        if (error) {
          throw new Error("売止設定に失敗しました")
        }

        toast({
          title: "売止に設定しました",
        })
      }

      fetchSoldOutSettings(selectedDate)
    } catch (error) {
      const message = error instanceof Error ? error.message : "売止設定の更新に失敗しました"
      toast({
        title: "エラーが発生しました",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">予約枠管理</h2>
        <Button onClick={() => {
          setSelectedSlot(undefined)
          setIsDialogOpen(true)
        }}>
          新規作成
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>売止設定</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              locale={ja}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>予約枠一覧</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>時間</TableHead>
                  <TableHead>定員</TableHead>
                  <TableHead>状態</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slots.map((slot) => (
                  <TableRow key={slot.slot_id}>
                    <TableCell>
                      {format(new Date(`2000-01-01T${slot.start_time}`), "H:mm", {
                        locale: ja,
                      })}
                      {" - "}
                      {format(new Date(`2000-01-01T${slot.end_time}`), "H:mm", {
                        locale: ja,
                      })}
                    </TableCell>
                    <TableCell>{slot.capacity}名</TableCell>
                    <TableCell>
                      {soldOutSlotIds.has(slot.slot_id) ? (
                        <span className="text-destructive font-medium">売止中</span>
                      ) : (
                        <span className="text-primary font-medium">予約可能</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedSlot(slot)
                            setIsDialogOpen(true)
                          }}
                        >
                          編集
                        </Button>
                        <Button
                          size="sm"
                          variant={soldOutSlotIds.has(slot.slot_id) ? "default" : "destructive"}
                          onClick={() => handleToggleSoldOut(slot)}
                          disabled={isLoading}
                        >
                          {soldOutSlotIds.has(slot.slot_id) ? "売止解除" : "売止"}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(slot.slot_id)}
                          disabled={isLoading}
                        >
                          削除
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedSlot ? "予約枠を編集" : "予約枠を作成"}
            </DialogTitle>
          </DialogHeader>
          <SlotForm
            slot={selectedSlot}
            onSuccess={() => {
              setIsDialogOpen(false)
              fetchSlots()
            }}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}