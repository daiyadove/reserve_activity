"use client"

import React, { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { useRouter } from "next/navigation"

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
  const [formData, setFormData] = useState<z.infer<typeof formSchema> | null>(null)
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null)
  const [isClient, setIsClient] = useState(false)
  const { toast } = useToast()
  const supabase = createClientSupabaseClient()
  const router = useRouter()

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
        description: `${data.name}（${data.discount_percentage}%OFF）`,
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
    try {
      setIsLoading(true)
      setFormData(values)

      // 割引後の金額を計算
      const baseAmount = menu.price * values.number_of_people
      const discountAmount = appliedCoupon 
        ? Math.floor(baseAmount * (appliedCoupon.discount_percentage / 100))
        : 0
      const finalAmount = Math.max(baseAmount - discountAmount, 0)

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

      // 支払いページへリダイレクト
      const searchParams = new URLSearchParams({
        menuName: menu.name,
        baseAmount: baseAmount.toString(),
        discountAmount: discountAmount.toString(),
        finalAmount: finalAmount.toString(),
        numberOfPeople: values.number_of_people.toString(),
        customerName: values.name,
        customerId: customerData.customer_id,
        slotId: slot.slot_id,
        menuId: menu.menu_id,
        reservationDate: slot.date,
        couponId: appliedCoupon?.coupon_id || "",
      })

      router.push(`/payment?${searchParams.toString()}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : "エラーが発生しました"
      toast({
        title: "エラー",
        description: message,
        variant: "destructive",
      })
      setIsLoading(false)
    }
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
                  {appliedCoupon.name}（{appliedCoupon.discount_percentage}%OFF）
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
