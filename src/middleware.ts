import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth?.user
  const { pathname } = nextUrl

  const isAuthPage = ["/login", "/signup", "/forgot-password", "/reset-password"].some(p => pathname.startsWith(p))
  const isProtected = ["/dashboard", "/admin", "/onboarding"].some(p => pathname.startsWith(p))

  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api/auth|api/chat|_next/static|_next/image|favicon.ico|widget.js|uploads).*)"],
}
