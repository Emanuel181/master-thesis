import { auth } from "@/auth"
import { NextResponse } from "next/server"
import { DEMO_ROUTE_PREFIX } from "@/lib/demo-mode"

export default auth((req) => {
    const { pathname } = req.nextUrl

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
 * 🎯 Middleware Matcher Configuration
 * ------------------------------------------------
 * ⚠️  CRITICAL: /api/health is EXCLUDED via negative lookahead
 *
 * Health checks MUST be excluded at the matcher level, NOT at runtime.
 * Why? Because auth() runs BEFORE the middleware function body executes.
 *
 * If /api/health is included in the matcher:
 *   1. ALB sends request (no cookies, no auth headers)
 *   2. auth() wrapper runs first (parses cookies, verifies JWTs, async work)
 *   3. This can hang/timeout before your bypass code ever runs
 *   4. ALB sees timeout → marks instance unhealthy
 *
 * By excluding /api/health from the matcher:
 *   1. ALB sends request
 *   2. Middleware is COMPLETELY SKIPPED
 *   3. Request goes directly to route handler
 *   4. Fast 200 response, ALB happy
 *
 * @type {import('next').NextConfig['proxy']}
 */
export const config = {
    matcher: [
        "/dashboard/:path*",
        "/demo/:path*",
        // Match all /api/* routes EXCEPT /api/health and /api/health/*
        "/api/:path*",
        "/((?!health).*)",

    ],
}
