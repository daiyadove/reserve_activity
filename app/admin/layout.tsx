"use client"

import { AdminNav } from "@/components/admin-nav"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/lib/supabase"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClientComponentClient<Database>()
  const [isLoading, setIsLoading] = useState(true)

  // ログインページの場合は認証チェックをスキップ
  const isLoginPage = pathname === "/admin/login"

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session && !isLoginPage) {
        router.refresh()
        router.push("/admin/login")
      }
      setIsLoading(false)
    }

    checkAuth()

    // セッション変更を監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "SIGNED_OUT" || !session) && !isLoginPage) {
        router.refresh()
        router.push("/admin/login")
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, supabase, isLoginPage])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh()
    router.push("/admin/login")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  // ログインページの場合はヘッダーを表示しない
  if (isLoginPage) {
    return children
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <div className="border-b bg-white">
        <div className="container flex h-16 items-center justify-between">
          <h1 className="text-lg font-bold">管理者ページ</h1>
          <Button variant="outline" onClick={handleLogout}>
            ログアウト
          </Button>
        </div>
      </div>
      <div className="container py-6">
        <AdminNav />
        {children}
      </div>
    </div>
  )
}