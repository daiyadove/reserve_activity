"use client"

import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

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
import { createClientSupabaseClient } from "@/lib/supabase"

const formSchema = z.object({
  code: z.string()
    .min(4, "コードは4文字以上で入力してください")
    .max(20, "コードは20文字以下で入力してください")
    .regex(/^[A-Za-z0-9]+$/, "英数字のみ使用できます"),
  name: z.string().min(1, "名前を入力してください"),
  discount_amount: z.number()
    .min(1, "1円以上を入力してください")
    .max(10000, "10,000円以下を入力してください"),
})

interface CouponFormProps {
  onSuccess: () => void
  onCancel: () => void
}

export function CouponForm({ onSuccess, onCancel }: CouponFormProps): React.ReactElement {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const supabase = createClientSupabaseClient()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
      name: "",
      discount_amount: 500,
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true)

      // コードの重複チェック
      const { data: existingCoupon, error: checkError } = await supabase
        .from("coupons")
        .select("coupon_id")
        .eq("code", values.code)
        .single()

      if (checkError && checkError.code !== "PGRST116") {
        throw new Error("コードの重複チェックに失敗しました")
      }

      if (existingCoupon) {
        form.setError("code", {
          type: "manual",
          message: "このコードは既に使用されています",
        })
        return
      }

      // クーポンを作成
      const { error: createError } = await supabase
        .from("coupons")
        .insert({
          code: values.code.toUpperCase(),
          name: values.name,
          discount_amount: values.discount_amount,
        })

      if (createError) {
        throw new Error("クーポンの作成に失敗しました")
      }

      toast({
        title: "クーポンを作成しました",
        description: `コード: ${values.code.toUpperCase()}`,
      })

      onSuccess()
    } catch (error) {
      const message = error instanceof Error ? error.message : "エラーが発生しました"
      toast({
        title: "エラー",
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
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>クーポンコード</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="SUMMER2024"
                  className="uppercase"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>クーポン名</FormLabel>
              <FormControl>
                <Input {...field} placeholder="夏季キャンペーン" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="discount_amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>割引額（円）</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  max={10000}
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
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
            {isLoading ? "作成中..." : "作成"}
          </Button>
        </div>
      </form>
    </Form>
  )
}