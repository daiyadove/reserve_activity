import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const data = await request.json()

    // 予約情報を保存
    const { data: reservationData, error: reservationError } = await supabase
      .from("reservations")
      .insert({
        customer_id: data.customerId,
        slot_id: data.slotId,
        menu_id: data.menuId,
        reservation_date: data.reservationDate,
        number_of_people: data.numberOfPeople,
      })
      .select()
      .single()

    if (reservationError) {
      throw new Error("予約情報の保存に失敗しました")
    }

    // クーポンが適用されている場合、使用履歴を保存
    if (data.couponId) {
      const { error: couponError } = await supabase
        .from("coupon_usages")
        .insert({
          coupon_id: data.couponId,
          reservation_id: reservationData.reservation_id,
        })

      if (couponError) {
        throw new Error("クーポン使用履歴の保存に失敗しました")
      }
    }

    return NextResponse.json({ success: true, data: reservationData })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "予約の保存に失敗しました" 
      },
      { status: 500 }
    )
  }
} 