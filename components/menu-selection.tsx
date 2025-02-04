"use client"

import React from "react"
import Image from "next/image"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MenuItem } from "@/types/reservation"

interface MenuSelectionProps {
  menuItems: MenuItem[]
  selectedDate: Date
  selectedTime: string
  onSelect: (menu: MenuItem) => void
  onBack: () => void
}

export function MenuSelection({
  menuItems,
  selectedDate,
  selectedTime,
  onSelect,
  onBack,
}: MenuSelectionProps): React.ReactElement {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">メニューを選択</h2>
        <Button variant="outline" onClick={onBack}>
          日時選択に戻る
        </Button>
      </div>

      <p className="text-muted-foreground">
        {format(selectedDate, "M月d日", { locale: ja })} {format(new Date(`2000-01-01T${selectedTime}`), "H:mm", { locale: ja })}の予約
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {menuItems.map((menu) => (
          <Card
            key={menu.menu_id}
            className="cursor-pointer hover:bg-accent transition-colors"
            onClick={() => onSelect(menu)}
          >
            <CardHeader>
              <CardTitle>{menu.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video mb-4 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                {menu.image_url ? (
                  <Image
                    src={menu.image_url}
                    alt={menu.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="text-muted-foreground text-center p-4">
                    <p className="text-lg font-medium mb-2">{menu.name}</p>
                    <p className="text-sm">{menu.duration}分 - ¥{menu.price.toLocaleString()}</p>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <p className="text-muted-foreground">{menu.description}</p>
                <div className="flex justify-between items-center">
                  <span className="font-medium">
                    所要時間: {menu.duration}分
                  </span>
                  <span className="text-lg font-bold">
                    ¥{menu.price.toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}