import { auth } from "@/auth";
import { NextResponse } from "next/server";

export const proxy = auth((req) => {
    const { pathname } = req.nextUrl;

    // Protect dashboard, profile, and admin routes
    if (
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/profile")
    ) {
        if (!req.auth) {
            const loginUrl = new URL("/login", req.url);
            loginUrl.searchParams.set("callbackUrl", pathname);
            return NextResponse.redirect(loginUrl);
        }
    }

    // Admin routes require auth (admin check is done at the API/page level)
    if (pathname.startsWith("/admin")) {
        if (!req.auth) {
            return NextResponse.redirect(new URL("/login", req.url));
        }
    }

    return NextResponse.next();
});

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/profile/:path*",
        "/admin/:path*",
    ],
};
