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
import { TimeSlot } from "@/types/reservation"
import { supabase } from "@/lib/supabase"

const formSchema = z.object({
  start_hour: z.string().regex(/^([0-1]?[0-9]|2[0-3])$/, "0-23の数値を入力してください"),
  start_minute: z.string().regex(/^[0-5]?[0-9]$/, "0-59の数値を入力してください"),
  end_hour: z.string().regex(/^([0-1]?[0-9]|2[0-3])$/, "0-23の数値を入力してください"),
  end_minute: z.string().regex(/^[0-5]?[0-9]$/, "0-59の数値を入力してください"),
  capacity: z.string().regex(/^[1-9][0-9]*$/, "1以上の数値を入力してください"),
})

interface SlotFormProps {
  slot?: TimeSlot
  onSuccess: () => void
  onCancel: () => void
}

export function SlotForm({ slot, onSuccess, onCancel }: SlotFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: slot
      ? {
          start_hour: format(new Date(`2000-01-01T${slot.start_time}`), "H"),
          start_minute: format(new Date(`2000-01-01T${slot.start_time}`), "mm"),
          end_hour: format(new Date(`2000-01-01T${slot.end_time}`), "H"),
          end_minute: format(new Date(`2000-01-01T${slot.end_time}`), "mm"),
          capacity: String(slot.capacity),
        }
      : {
          start_hour: "9",
          start_minute: "00",
          end_hour: "10",
          end_minute: "00",
          capacity: "1",
        },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true)

      const start_time = `${values.start_hour.padStart(2, '0')}:${values.start_minute.padStart(2, '0')}:00`
      const end_time = `${values.end_hour.padStart(2, '0')}:${values.end_minute.padStart(2, '0')}:00`

      if (end_time <= start_time) {
        toast({
          title: "エラー",
          description: "終了時間は開始時間より後に設定してください",
          variant: "destructive",
        })
        return
      }

      const slotData = {
        start_time,
        end_time,
        capacity: parseInt(values.capacity),
      }

      if (slot) {
        // 更新
        const { error: updateError } = await supabase
          .from("time_slots")
          .update(slotData)
          .eq("slot_id", slot.slot_id)

        if (updateError) {
          throw new Error("予約枠の更新に失敗しました")
        }

        toast({
          title: "予約枠を更新しました",
          description: `${format(new Date(`2000-01-01T${start_time}`), "H:mm", { locale: ja })}～${format(
            new Date(`2000-01-01T${end_time}`),
            "H:mm",
            { locale: ja }
          )}`,
        })
      } else {
        // 新規作成
        const { error: createError } = await supabase.from("time_slots").insert(slotData)

        if (createError) {
          throw new Error("予約枠の作成に失敗しました")
        }

        toast({
          title: "予約枠を作成しました",
          description: `${format(new Date(`2000-01-01T${start_time}`), "H:mm", { locale: ja })}～${format(
            new Date(`2000-01-01T${end_time}`),
            "H:mm",
            { locale: ja }
          )}`,
        })
      }

      onSuccess()
    } catch (error) {
      const message = error instanceof Error ? error.message : "予約枠の保存に失敗しました"
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
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="start_hour"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>開始時刻（時）</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" min={0} max={23} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="start_minute"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>開始時刻（分）</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" min={0} max={59} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4">
            <FormField
              control={form.control}
              name="end_hour"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>終了時刻（時）</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" min={0} max={23} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="end_minute"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>終了時刻（分）</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" min={0} max={59} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <FormField
          control={form.control}
          name="capacity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>定員</FormLabel>
              <FormControl>
                <Input {...field} type="number" min={1} />
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
            {isLoading ? "保存中..." : slot ? "更新" : "作成"}
          </Button>
        </div>
      </form>
    </Form>
  )
}