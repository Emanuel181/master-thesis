import { auth } from "@/auth"
import { NextResponse } from "next/server"
import { 
    DEMO_ROUTE_PREFIX 
} from "@/lib/demo-mode"

export default auth((req) => {
    const { pathname } = req.nextUrl;
    
    // STRICT SEPARATION ENFORCEMENT
    const requestHeaders = new Headers(req.headers);

    // 1. DEMO MODE (/demo/*)
    if (pathname.startsWith(DEMO_ROUTE_PREFIX)) {
        // Strict Cookie Stripping
        // Enforces "No Shared Credentials" by removing all cookies before request reaches app
        requestHeaders.delete('cookie');
        requestHeaders.delete('authorization'); // Also strip auth header if present
        
        // Mark as demo mode for downstream logic (if any)
        requestHeaders.set('x-vulniq-demo-mode', 'true');
        
        // API ACCESS CONTROL:
        // Only allow access to /demo/api/*
        // Block access to standard /api/* from demo context
        // Note: The frontend should be calling /demo/api/*, so if we see /api/* here
        // while in demo context, it's either a mistake or an attack.
        if (pathname.startsWith('/api')) {
             return NextResponse.json(
                { error: 'Demo mode cannot access production APIs', code: 'DEMO_MODE_BLOCKED' },
                { status: 403 }
            );
        }
    } 
    // 2. PRODUCTION MODE (/api/*, /dashboard/*)
    else {
        // SECURITY: Sanitize header for production requests
        // This prevents malicious clients from sending 'x-vulniq-demo-mode: true'
        // to bypass authentication on mixed-mode APIs.
        // We explicitly set it to false to overwrite any client-provided value.
        requestHeaders.set('x-vulniq-demo-mode', 'false');
    }

    // 3. Existing Auth Logic for Production
    if (!req.auth && pathname.startsWith("/dashboard")) {
        const newUrl = new URL("/login", req.nextUrl.origin)
        return NextResponse.redirect(newUrl)
    }

    return NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });
})

export const config = {
    matcher: [
        "/dashboard/:path*", 
        "/demo/:path*",
        "/api/:path((?!health).*)",
    ],
}
