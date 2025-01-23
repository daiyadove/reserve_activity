"use client"

import React, { useState, useEffect } from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { DailyTimeSlot, MenuItem } from "@/types/reservation"
import { createClientSupabaseClient } from "@/lib/supabase"
import { PaymentForm } from "@/components/payment-form"

const formSchema = z.object({
  name: z.string().min(1, "名前を入力してください"),
  email: z.string().email("有効なメールアドレスを入力してください"),
  phone_number: z.string().min(1, "電話番号を入力してください"),
  number_of_people: z.number()
    .min(1, "1人以上を選択してください")
    .max(10, "10人以下を選択してください"),
  menu_id: z.string().min(1, "メニューを選択してください"),
})

interface ReservationFormProps {
  slot: DailyTimeSlot
  onSuccess: () => void
  onCancel: () => void
}

export function ReservationForm({ slot, onSuccess, onCancel }: ReservationFormProps): React.ReactElement {
  const [isLoading, setIsLoading] = useState(false)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [showPayment, setShowPayment] = useState(false)
  const [formData, setFormData] = useState<z.infer<typeof formSchema> | null>(null)
  const { toast } = useToast()
  const supabase = createClientSupabaseClient()

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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone_number: "",
      number_of_people: 1,
      menu_id: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setFormData(values)
    setShowPayment(true)
  }

  async function handlePaymentSuccess() {
    try {
      setIsLoading(true)

      if (!formData) return

      // 顧客情報を保存
      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .insert({
          name: formData.name,
          email: formData.email,
          phone_number: formData.phone_number,
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
          menu_id: formData.menu_id,
          reservation_date: slot.date,
          number_of_people: formData.number_of_people,
        })

      if (reservationError) {
        throw new Error("予約情報の保存に失敗しました")
      }

      // 選択されたメニューの情報を取得
      const selectedMenu = menuItems.find(menu => menu.menu_id === formData.menu_id)

      toast({
        title: "予約が完了しました",
        description: `${format(new Date(slot.date), "M月d日", { locale: ja })} ${format(new Date(`2000-01-01T${slot.start_time}`), "H:mm", { locale: ja })}から${selectedMenu?.name}の予約を受け付けました。`,
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

  function handlePaymentError(error: string) {
    toast({
      title: "支払いエラー",
      description: error,
      variant: "destructive",
    })
  }

  if (showPayment && formData) {
    const selectedMenu = menuItems.find(menu => menu.menu_id === formData.menu_id)
    if (!selectedMenu) return (
      <div className="text-destructive">メニューの情報が見つかりません</div>
    )

    return (
      <div className="space-y-4">
        <div className="text-sm space-y-2">
          <p><strong>メニュー:</strong> {selectedMenu.name}</p>
          <p><strong>金額:</strong> ¥{selectedMenu.price.toLocaleString()}</p>
          <p><strong>予約者:</strong> {formData.name}</p>
          <p><strong>人数:</strong> {formData.number_of_people}名</p>
        </div>
        <PaymentForm
          amount={selectedMenu.price * formData.number_of_people}
          menuName={selectedMenu.name}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowPayment(false)}
          className="w-full"
        >
          戻る
        </Button>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="menu_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>メニュー</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="メニューを選択してください" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {menuItems.map((menu) => (
                    <SelectItem key={menu.menu_id} value={menu.menu_id}>
                      {menu.name} ({menu.duration}分) - ¥{menu.price.toLocaleString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {field.value && (
                <p className="text-sm text-muted-foreground mt-2">
                  {menuItems.find(menu => menu.menu_id === field.value)?.description}
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
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
            {isLoading ? "処理中..." : "次へ"}
          </Button>
        </div>
      </form>
    </Form>
  )
}