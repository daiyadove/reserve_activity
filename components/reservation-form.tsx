"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"
import { ja } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { DailyTimeSlot } from "@/types/reservation"
import { supabase } from "@/lib/supabase"

const formSchema = z.object({
  name: z.string().min(1, "名前を入力してください"),
  email: z.string().email("有効なメールアドレスを入力してください"),
  phone_number: z.string().min(1, "電話番号を入力してください"),
  number_of_people: z.number()
    .min(1, "1人以上を選択してください")
    .max(10, "10人以下を選択してください"),
})

interface ReservationFormProps {
  slot: DailyTimeSlot
  onSuccess: () => void
  onCancel: () => void
}

export function ReservationForm({ slot, onSuccess, onCancel }: ReservationFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone_number: "",
      number_of_people: 1,
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true)

      // 顧客情報を保存
      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .insert({
          name: values.name,
          email: values.email,
          phone_number: values.phone_number,
        })
        .select()
        .single()

      if (customerError) {
        throw new Error("顧客情報の保存に失敗しました")
      }

      // 予約情報を保存
      const { error: reservationError } = await supabase
        .from("reservations")
        .insert({
          customer_id: customerData.customer_id,
          slot_id: slot.slot_id,
          reservation_date: slot.date,
          number_of_people: values.number_of_people,
        })

      if (reservationError) {
        throw new Error("予約情報の保存に失敗しました")
      }

      toast({
        title: "予約が完了しました",
        description: `${format(new Date(slot.date), "M月d日", { locale: ja })} ${format(new Date(`2000-01-01T${slot.start_time}`), "H:mm", { locale: ja })}からの予約を受け付けました。`,
      })

      onSuccess()
    } catch (error) {
      const message = error instanceof Error ? error.message : "予約に失敗しました"
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>お名前</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>メールアドレス</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>電話番号</FormLabel>
              <FormControl>
                <Input type="tel" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="number_of_people"
          render={({ field }) => (
            <FormItem>
              <FormLabel>予約人数</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min={1} 
                  max={10} 
                  {...field} 
                  onChange={e => field.onChange(parseInt(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            キャンセル
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "予約中..." : "予約する"}
          </Button>
        </div>
      </form>
    </Form>
  )
}