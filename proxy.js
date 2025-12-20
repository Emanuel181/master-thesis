import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

// Define protected routes that require authentication
const protectedRoutes = ["/dashboard", "/profile"]

// Define public routes that authenticated users shouldn't access (like login)
const authRoutes = ["/login"]

async function proxy(req) {
    const { nextUrl } = req

    // Get the token using next-auth/jwt (Edge compatible)
    const token = await getToken({
        req,
        secret: process.env.AUTH_SECRET
    })

    const isLoggedIn = !!token

    const isProtectedRoute = protectedRoutes.some(route =>
        nextUrl.pathname.startsWith(route)
    )

    const isAuthRoute = authRoutes.some(route =>
        nextUrl.pathname.startsWith(route)
    )

    // If user is not logged in and trying to access protected route
    if (isProtectedRoute && !isLoggedIn) {
        const loginUrl = new URL("/login", nextUrl.origin)
        // Add callback URL so user is redirected back after login
        loginUrl.searchParams.set("callbackUrl", nextUrl.pathname)
        return NextResponse.redirect(loginUrl)
    }

    // If user is logged in and trying to access auth routes (login page)
    if (isAuthRoute && isLoggedIn) {
        return NextResponse.redirect(new URL("/dashboard", nextUrl.origin))
    }

    return NextResponse.next()
}

// Export as both default and named export
export { proxy }
export default proxy

// Configure which routes the proxy should run on
export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder files
         */
        "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)",
    ],
}
