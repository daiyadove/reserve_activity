import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()

  const supabase = createMiddlewareClient({ req: request, res })

  try {
    const { data: { session } } = await supabase.auth.getSession()

    // 管理者ページへのアクセスをチェック
    if (request.nextUrl.pathname.startsWith('/admin')) {
      // ログインページは除外
      if (request.nextUrl.pathname === '/admin/login') {
        // セッションがある場合は管理画面にリダイレクト
        if (session) {
          return NextResponse.redirect(new URL('/admin', request.url))
        }
        return res
      }

      // セッションがない場合はログインページにリダイレクト
      if (!session) {
        return NextResponse.redirect(new URL('/admin/login', request.url))
      }
    }

    return res
  } catch (error) {
    console.error('Auth middleware error:', error)
    // エラーが発生した場合はログインページにリダイレクト
    if (request.nextUrl.pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    return res
  }
}

export const config = {
  matcher: ['/admin/:path*'],
}