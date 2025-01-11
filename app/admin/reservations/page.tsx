"use client"

import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { Reservation } from "@/types/reservation"

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [searchDate, setSearchDate] = useState<Date>()
  const [searchName, setSearchName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // 予約一覧を取得
  const fetchReservations = async () => {
    try {
      setIsLoading(true)

      let query = supabase
        .from("reservations")
        .select(`
          *,
          customers (
            name,
            email,
            phone_number
          ),
          time_slot:slot_id (
            start_time,
            end_time
          )
        `)
        .order("reservation_date", { ascending: false })

      if (searchDate) {
        query = query.eq("reservation_date", format(searchDate, "yyyy-MM-dd"))
      }

      if (searchName) {
        query = query.textSearch("customers.name", searchName)
      }

      const { data, error } = await query

      if (error) {
        throw new Error("予約情報の取得に失敗しました")
      }

      setReservations(data || [])
    } catch (error) {
      const message = error instanceof Error ? error.message : "予約情報の取得に失敗しました"
      toast({
        title: "エラーが発生しました",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchReservations()
  }, [])

  // 予約をキャンセル
  const handleCancel = async (reservationId: string) => {
    if (!confirm("この予約をキャンセルしてもよろしいですか？")) {
      return
    }

    try {
      setIsLoading(true)
      const { error } = await supabase
        .from("reservations")
        .delete()
        .eq("reservation_id", reservationId)

      if (error) {
        throw new Error("予約のキャンセルに失敗しました")
      }

      toast({
        title: "予約をキャンセルしました",
      })
      fetchReservations()
    } catch (error) {
      const message = error instanceof Error ? error.message : "予約のキャンセルに失敗しました"
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
      <h2 className="text-2xl font-bold">予約一覧</h2>

      <Card>
        <CardHeader>
          <CardTitle>検索</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">日付で検索</label>
              <Calendar
                mode="single"
                selected={searchDate}
                onSelect={setSearchDate}
                locale={ja}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">お客様名で検索</label>
              <Input
                placeholder="お客様名を入力"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
              />
              <Button
                className="w-full"
                onClick={fetchReservations}
                disabled={isLoading}
              >
                検索
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>予約日</TableHead>
                <TableHead>お客様名</TableHead>
                <TableHead>連絡先</TableHead>
                <TableHead>予約時間</TableHead>
                <TableHead>人数</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reservations.map((reservation) => (
                <TableRow key={reservation.reservation_id}>
                  <TableCell>
                    {format(
                      new Date(reservation.reservation_date),
                      "M/d",
                      { locale: ja }
                    )}
                  </TableCell>
                  <TableCell>{reservation.customers?.name}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{reservation.customers?.email}</div>
                      <div>{reservation.customers?.phone_number}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(
                      new Date(`2000-01-01T${reservation.time_slot?.start_time}`),
                      "H:mm",
                      { locale: ja }
                    )}
                    {" - "}
                    {format(
                      new Date(`2000-01-01T${reservation.time_slot?.end_time}`),
                      "H:mm",
                      { locale: ja }
                    )}
                  </TableCell>
                  <TableCell>{reservation.number_of_people}名</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleCancel(reservation.reservation_id)}
                      disabled={isLoading}
                    >
                      キャンセル
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}