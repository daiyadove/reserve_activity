"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center space-x-4 lg:space-x-6 mb-8">
      <Link
        href="/admin"
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          pathname === "/admin"
            ? "text-primary"
            : "text-muted-foreground"
        )}
      >
        ダッシュボード
      </Link>
      <Link
        href="/admin/slots"
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          pathname === "/admin/slots"
            ? "text-primary"
            : "text-muted-foreground"
        )}
      >
        予約枠管理
      </Link>
      <Link
        href="/admin/reservations"
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          pathname === "/admin/reservations"
            ? "text-primary"
            : "text-muted-foreground"
        )}
      >
        予約一覧
      </Link>
      <Link href="/" className="ml-auto">
        <Button variant="outline">
          サイトを表示
        </Button>
      </Link>
    </nav>
  )
}