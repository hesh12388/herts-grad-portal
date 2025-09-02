import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  // Get the session token
  const token = await getToken({ 
    req, 
    secret: process.env.NEXTAUTH_SECRET 
  })
  
  
  // Check if route needs protection
  const isApiRoute = pathname.startsWith('/api/')
  const isDashboard = pathname.startsWith('/dashboard')
  const isAdmin = pathname.startsWith('/admin')
  
  // Don't protect NextAuth routes!
  if (pathname.startsWith('/api/auth/') || pathname.startsWith('/api/verify/')) {
    return NextResponse.next()
  }
  
  // Protect API routes (except auth)
  if (isApiRoute && !token) {
    return new NextResponse('Unauthorized', { status: 401 })
  }
  
  // Protect dashboard pages
  if (isDashboard) {
    if (!token) {
      const signInUrl = new URL('/', req.url)
      signInUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(signInUrl)
    }
  }

  if (isAdmin) {
    if (!token) {
      const signInUrl = new URL('/', req.url)
      signInUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(signInUrl)
    }
    if (token.role !== 'ADMIN') {
      return new NextResponse('Forbidden', { status: 403 })
    }
  }
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard',
    '/api/:path*',
    '/admin',
  ]
}