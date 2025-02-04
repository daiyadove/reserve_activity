"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { Coupon } from "@/types/reservation"
import { cn } from "@/lib/utils"
import { createClientSupabaseClient } from "@/lib/supabase"
import { CouponForm } from "@/components/coupon-form"

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<(Coupon & { usage_count: number })[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const supabase = createClientSupabaseClient()

  // クーポン一覧を取得
  const fetchCoupons = async () => {
    try {
      setIsLoading(true)

      // クーポン情報を取得
      const { data: couponsData, error: couponsError } = await supabase
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false })

      if (couponsError) {
        throw new Error("クーポン情報の取得に失敗しました")
      }

      // 各クーポンの使用回数を取得
      const { data: usageData, error: usageError } = await supabase
        .from("coupon_usages")
        .select("coupon_id, count")
        .select("coupon_id")

      if (usageError) {
        throw new Error("クーポン使用履歴の取得に失敗しました")
      }

      // 使用回数をカウント
      const usageCounts = usageData.reduce((acc, curr) => {
        acc[curr.coupon_id] = (acc[curr.coupon_id] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      // クーポン情報と使用回数を結合
      const couponsWithUsage = couponsData.map(coupon => ({
        ...coupon,
        usage_count: usageCounts[coupon.coupon_id] || 0
      }))

      setCoupons(couponsWithUsage)
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

  useEffect(() => {
    fetchCoupons()
  }, [])

  // クーポンの有効/無効を切り替え
  const toggleCouponStatus = async (couponId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("coupons")
        .update({ is_active: !currentStatus })
        .eq("coupon_id", couponId)

      if (error) {
        throw new Error("クーポンの状態更新に失敗しました")
      }

      await fetchCoupons()

      toast({
        title: "更新完了",
        description: `クーポンを${!currentStatus ? "有効" : "無効"}にしました`,
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">クーポン管理</h2>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          新規作成
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>コード</TableHead>
              <TableHead>名前</TableHead>
              <TableHead>割引額</TableHead>
              <TableHead>使用回数</TableHead>
              <TableHead>状態</TableHead>
              <TableHead>作成日時</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  読み込み中...
                </TableCell>
              </TableRow>
            ) : coupons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  クーポンがありません
                </TableCell>
              </TableRow>
            ) : (
              coupons.map((coupon) => (
                <TableRow key={coupon.coupon_id}>
                  <TableCell className="font-mono">{coupon.code}</TableCell>
                  <TableCell>{coupon.name}</TableCell>
                  <TableCell>¥{coupon.discount_amount.toLocaleString()}</TableCell>
                  <TableCell>{coupon.usage_count}回</TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                        coupon.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      )}
                    >
                      {coupon.is_active ? "有効" : "無効"}
                    </span>
                  </TableCell>
                  <TableCell>
                    {format(new Date(coupon.created_at), "yyyy/MM/dd HH:mm", {
                      locale: ja,
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleCouponStatus(coupon.coupon_id, coupon.is_active)}
                    >
                      {coupon.is_active ? "無効にする" : "有効にする"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>クーポン作成</DialogTitle>
          </DialogHeader>
          <CouponForm
            onSuccess={() => {
              setShowCreateDialog(false)
              fetchCoupons()
            }}
            onCancel={() => setShowCreateDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}