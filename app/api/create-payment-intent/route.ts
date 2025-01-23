import { NextResponse } from "next/server"
import Stripe from "stripe"

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing Stripe secret key")
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-12-18.acacia",
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { amount, menuName } = body

    // 支払いインテントを作成
    const paymentIntent = await stripe.paymentIntents.create({
      amount, // 金額（日本円）
      currency: "jpy",
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        menuName,
      },
    })

    return NextResponse.json({ clientSecret: paymentIntent.client_secret })
  } catch (error) {
    console.error("Error creating payment intent:", error)
    return NextResponse.json(
      { error: "支払い処理の初期化に失敗しました" },
      { status: 500 }
    )
  }
}