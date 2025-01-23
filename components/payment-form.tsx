"use client"

import { useState } from "react"
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"
import { useStripePayment } from "@/hooks/use-stripe-payment"

interface PaymentFormProps {
  amount: number
  menuName: string
  onSuccess: () => void
  onError: (error: string) => void
}

function CheckoutForm({ onSuccess, onError }: Omit<PaymentFormProps, "amount" | "menuName">) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment/complete`,
        },
        redirect: "if_required",
      })

      if (error) {
        onError(error.message ?? "支払い処理に失敗しました")
      } else {
        onSuccess()
      }
    } catch {
      onError("支払い処理中にエラーが発生しました")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full"
      >
        {isProcessing ? "処理中..." : "支払いを完了する"}
      </Button>
    </form>
  )
}

export function PaymentForm({ amount, menuName, onSuccess, onError }: PaymentFormProps) {
  const { stripePromise, options, clientSecret, isLoading, error } = useStripePayment(
    amount,
    menuName
  )

  if (isLoading) {
    return <div>決済システムを準備中...</div>
  }

  if (error) {
    return <div className="text-destructive">{error}</div>
  }

  if (!clientSecret) {
    return null
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm onSuccess={onSuccess} onError={onError} />
    </Elements>
  )
}