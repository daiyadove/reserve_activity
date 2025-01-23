import { useState, useEffect } from "react"
import {
  loadStripe,
  StripeElementsOptions,
} from "@stripe/stripe-js"

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
)

export function useStripePayment(amount: number, menuName: string) {
  const [clientSecret, setClientSecret] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initializePayment = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch("/api/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount, menuName }),
        })

        if (!response.ok) {
          throw new Error("支払い処理の初期化に失敗しました")
        }

        const data = await response.json()
        setClientSecret(data.clientSecret)
      } catch (err) {
        setError(err instanceof Error ? err.message : "エラーが発生しました")
      } finally {
        setIsLoading(false)
      }
    }

    if (amount > 0) {
      initializePayment()
    }
  }, [amount, menuName])

  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: "stripe",
      variables: {
        colorPrimary: "#0099FF",
        colorBackground: "#ffffff",
        colorText: "#30313d",
        colorDanger: "#df1b41",
        fontFamily: "system-ui, sans-serif",
        spacingUnit: "4px",
        borderRadius: "4px",
      },
    },
  }

  return {
    stripePromise,
    options,
    clientSecret,
    isLoading,
    error,
  }
}