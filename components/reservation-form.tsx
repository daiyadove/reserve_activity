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
import { useToast } from "@/hooks/use-toast"
import { DailyTimeSlot, MenuItem, Coupon } from "@/types/reservation"
import { createClientSupabaseClient } from "@/lib/supabase"
import { PaymentForm } from "@/components/payment-form"

const formSchema = z.object({
  name: z.string().min(1, "名前を入力してください"),
  email: z.string().email("有効なメールアドレスを入力してください"),
  phone_number: z.string().min(1, "電話番号を入力してください"),
  number_of_people: z.number()
    .min(1, "1人以上を選択してください")
    .max(10, "10人以下を選択してください"),
  coupon_code: z.string().optional(),
})

interface ReservationFormProps {
  slot: DailyTimeSlot
  menu: MenuItem
  onSuccess: () => void
  onCancel: () => void
}

export function ReservationForm({ slot, menu, onSuccess, onCancel }: ReservationFormProps): React.ReactElement {
  const [isLoading, setIsLoading] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [formData, setFormData] = useState<z.infer<typeof formSchema> | null>(null)
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null)
  const [isClient, setIsClient] = useState(false)
  const { toast } = useToast()
  const supabase = createClientSupabaseClient()

  // クライアントサイドでの初期化
  useEffect(() => {
    setIsClient(true)
  }, [])

  // URLからクーポンコードを取得して適用（クライアントサイドのみ）
  useEffect(() => {
    if (isClient) {
      const searchParams = new URLSearchParams(window.location.search)
      const couponCode = searchParams.get('coupon')
      if (couponCode) {
        form.setValue('coupon_code', couponCode)
        validateCoupon(couponCode)
      }
    }
  }, [isClient])

  const validateCoupon = async (code: string): Promise<void> => {
    try {
      setAppliedCoupon(null)
      if (!code) return

      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", code.toUpperCase())
        .eq("is_active", true)
        .single()

      if (error) {
        if (error.code === "PGRST116") {
          toast({
            title: "クーポンが見つかりません",
            description: "入力したコードをご確認ください",
            variant: "destructive",
          })
        } else {
          throw error
        }
        return
      }

      setAppliedCoupon(data)
      toast({
        title: "クーポンを適用しました",
        description: `${data.name}（${data.discount_amount}円引き/人）`,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "エラーが発生しました"
      toast({
        title: "エラー",
        description: message,
        variant: "destructive",
      })
    }
  }

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone_number: "",
      number_of_people: 1,
      coupon_code: "",
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
      const { data: reservationData, error: reservationError } = await supabase
        .from("reservations")
        .insert({
          customer_id: customerData.customer_id,
          slot_id: slot.slot_id,
          menu_id: menu.menu_id,
          reservation_date: slot.date,
          number_of_people: formData.number_of_people,
        })
        .select()
        .single()

      if (reservationError) {
        throw new Error("予約情報の保存に失敗しました")
      }

      // クーポンが適用されている場合、使用履歴を保存
      if (appliedCoupon) {
        const { error: couponError } = await supabase
          .from("coupon_usages")
          .insert({
            coupon_id: appliedCoupon.coupon_id,
            reservation_id: reservationData.reservation_id,
          })

        if (couponError) {
          throw new Error("クーポン使用履歴の保存に失敗しました")
        }
      }

      toast({
        title: "予約が完了しました",
        description: `${format(new Date(slot.date), "M月d日", { locale: ja })} ${format(new Date(`2000-01-01T${slot.start_time}`), "H:mm", { locale: ja })}から${menu.name}の予約を受け付けました。`,
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
    // 割引後の金額を計算
    const baseAmount = menu.price * formData.number_of_people
    const discountAmount = appliedCoupon ? appliedCoupon.discount_amount * formData.number_of_people : 0
    const finalAmount = Math.max(baseAmount - discountAmount, 0)

    return (
      <div className="space-y-4">
        <div className="text-sm space-y-2">
          <p><strong>メニュー:</strong> {menu.name}</p>
          <p><strong>予約者:</strong> {formData.name}</p>
          <p><strong>人数:</strong> {formData.number_of_people}名</p>
          <p><strong>料金:</strong> ¥{baseAmount.toLocaleString()}</p>
          {appliedCoupon && (
            <p><strong>割引:</strong> -¥{discountAmount.toLocaleString()} ({appliedCoupon.name})</p>
          )}
          <p className="font-bold">
            <strong>お支払い金額:</strong> ¥{finalAmount.toLocaleString()}
          </p>
        </div>
        <PaymentForm
          amount={finalAmount}
          menuName={menu.name}
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

  // 初期レンダリング時は空のdivを返す
  if (!isClient) {
    return <div />
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2 mb-4">
          <h3 className="font-medium">{menu.name}</h3>
          <p className="text-sm text-muted-foreground">{menu.description}</p>
          <p className="text-sm">
            <span className="font-medium">料金:</span> ¥{menu.price.toLocaleString()}
          </p>
          <p className="text-sm">
            <span className="font-medium">所要時間:</span> {menu.duration}分
          </p>
        </div>

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
        <FormField
          control={form.control}
          name="coupon_code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>クーポンコード（オプション）</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  className="uppercase"
                  placeholder="SUMMER2024"
                  onChange={(e) => {
                    field.onChange(e)
                    if (!e.target.value) {
                      setAppliedCoupon(null)
                    }
                  }}
                  onBlur={(e) => {
                    const code = e.target.value?.trim()
                    if (code) validateCoupon(code)
                  }}
                />
              </FormControl>
              {appliedCoupon && (
                <p className="text-sm text-green-600">
                  {appliedCoupon.name}（{appliedCoupon.discount_amount.toLocaleString()}円引き/人）
                </p>
              )}
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
