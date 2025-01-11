import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // 管理者ページへのアクセスをチェック
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // ログインページはチェック対象から除外
    if (request.nextUrl.pathname === '/admin/login') {
      // すでにログインしている場合は管理者ページにリダイレクト
      if (session) {
        return NextResponse.redirect(new URL('/admin', request.url))
      }
      return res
    }

    // その他の管理者ページは認証チェック
    if (!session) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  return res
}

export const config = {
  matcher: ['/admin/:path*'],
}