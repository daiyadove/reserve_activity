"use client"

import { PaymentForm } from "@/components/payment-form"
import { useToast } from "@/hooks/use-toast"
import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

export default function PaymentPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const [paymentDetails, setPaymentDetails] = useState<{
    menuName: string
    baseAmount: number
    discountAmount: number
    finalAmount: number
    numberOfPeople: number
    customerName: string
    customerId: string
    slotId: string
    menuId: string
    reservationDate: string
    couponId?: string
  } | null>(null)

  useEffect(() => {
    const couponId = searchParams.get("couponId")
    const details = {
      menuName: searchParams.get("menuName") || "",
      baseAmount: Number(searchParams.get("baseAmount")) || 0,
      discountAmount: Number(searchParams.get("discountAmount")) || 0,
      finalAmount: Number(searchParams.get("finalAmount")) || 0,
      numberOfPeople: Number(searchParams.get("numberOfPeople")) || 0,
      customerName: searchParams.get("customerName") || "",
      customerId: searchParams.get("customerId") || "",
      slotId: searchParams.get("slotId") || "",
      menuId: searchParams.get("menuId") || "",
      reservationDate: searchParams.get("reservationDate") || "",
      ...(couponId ? { couponId } : {}),
    }
    setPaymentDetails(details)
  }, [searchParams])

  const handlePaymentSuccess = async () => {
    try {
      // 予約情報を保存
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentDetails),
      })

      if (!response.ok) {
        throw new Error("予約の保存に失敗しました")
      }

      toast({
        title: "支払いが完了しました",
        description: "予約が確定されました。",
      })
      router.push("/reservation-complete")
    } catch (error) {
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : "予約の保存に失敗しました",
        variant: "destructive",
      })
    }
  }

  const handlePaymentError = (error: string) => {
    toast({
      title: "支払いエラー",
      description: error,
      variant: "destructive",
    })
  }

  if (!paymentDetails) {
    return <div>Loading...</div>
  }

  return (
    <div className="container max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">お支払い</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6 space-y-4">
        <div className="text-sm space-y-2">
          <p><strong>メニュー:</strong> {paymentDetails.menuName}</p>
          <p><strong>予約者:</strong> {paymentDetails.customerName}</p>
          <p><strong>人数:</strong> {paymentDetails.numberOfPeople}名</p>
          <p><strong>料金:</strong> ¥{paymentDetails.baseAmount.toLocaleString()}</p>
          {paymentDetails.discountAmount > 0 && (
            <p><strong>割引:</strong> -¥{paymentDetails.discountAmount.toLocaleString()} ({Math.floor((paymentDetails.discountAmount / paymentDetails.baseAmount) * 100)}%OFF)</p>
          )}
          <p className="font-bold">
            <strong>お支払い金額:</strong> ¥{paymentDetails.finalAmount.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <PaymentForm
          amount={paymentDetails.finalAmount}
          menuName={paymentDetails.menuName}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
        />
        
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="w-full mt-4"
        >
          戻る
        </Button>
      </div>
    </div>
  )
}
