import { auth } from "@/auth"
import { NextResponse } from "next/server"
import { DEMO_ROUTE_PREFIX } from "@/lib/demo-mode"

export default auth((req) => {
    const { pathname } = req.nextUrl

    /**
     * 🚑 HARD BYPASS — Infrastructure Health Check
     * ------------------------------------------------
     * - Required for ALB / ECS health checks
     * - No auth, no cookies, no redirects
     * - Safe: returns static 200 from route handler
     */
    if (pathname === "/api/health") {
        return NextResponse.next()
    }

    // Clone headers so we can safely mutate
    const requestHeaders = new Headers(req.headers)

    /**
     * 1️⃣ DEMO MODE (/demo/*)
     * ------------------------------------------------
     * Enforces strict isolation:
     * - No shared credentials
     * - No production API access
     */
    if (pathname.startsWith(DEMO_ROUTE_PREFIX)) {
        // Strip credentials completely
        requestHeaders.delete("cookie")
        requestHeaders.delete("authorization")

        // Explicitly mark demo mode for downstream logic
        requestHeaders.set("x-vulniq-demo-mode", "true")

        /**
         * SECURITY: Demo must NOT access production APIs
         */
        if (pathname.startsWith("/api")) {
            return NextResponse.json(
                {
                    error: "Demo mode cannot access production APIs",
                    code: "DEMO_MODE_BLOCKED",
                },
                { status: 403 }
            )
        }
    }

    /**
     * 2️⃣ PRODUCTION MODE
     * ------------------------------------------------
     * Explicitly sanitize demo header to prevent spoofing
     */
    else {
        requestHeaders.set("x-vulniq-demo-mode", "false")
    }

    /**
     * 3️⃣ AUTH GUARD — Dashboard
     * ------------------------------------------------
     */
    if (!req.auth && pathname.startsWith("/dashboard")) {
        const loginUrl = new URL("/login", req.nextUrl.origin)
        return NextResponse.redirect(loginUrl)
    }

    /**
     * Continue request with sanitized headers
     */
    return NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    })
})

/**
 * 🎯 Matcher (simple, predictable, safe)
 * ------------------------------------------------
 * Health check bypass is handled at runtime,
 * NOT via fragile matcher regex.
 */
export const config = {
    matcher: [
        "/dashboard/:path*",
        "/demo/:path*",
        "/api/:path*",
    ],
}
