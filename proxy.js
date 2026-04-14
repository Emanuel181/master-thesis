import createIntlMiddleware from 'next-intl/middleware';
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { routing } from './i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

export const proxy = auth((req) => {
    const { pathname } = req.nextUrl;

    // Strip locale prefix to check the actual route
    const localePattern = /^\/(en|ro|es|fr|de|pt|zh|ja|ko|ar|ru|it|hi|tr|nl|pl|sv)(\/|$)/;
    const match = pathname.match(localePattern);
    const strippedPath = match ? pathname.slice(match[1].length + 1) || '/' : pathname;

    // Protect dashboard and profile routes
    if (
        strippedPath.startsWith("/dashboard") ||
        strippedPath.startsWith("/profile")
    ) {
        if (!req.auth) {
            const locale = match ? match[1] : 'en';
            const loginUrl = new URL(`/${locale}/login`, req.url);
            loginUrl.searchParams.set("callbackUrl", pathname);
            return NextResponse.redirect(loginUrl);
        }
    }

    // Admin routes require auth
    if (strippedPath.startsWith("/admin")) {
        if (!req.auth) {
            const locale = match ? match[1] : 'en';
            return NextResponse.redirect(new URL(`/${locale}/login`, req.url));
        }
    }

    // Run next-intl middleware for locale routing
    return intlMiddleware(req);
});

export const config = {
    matcher: [
        // Match all paths except API, static files, _next internals
        '/((?!api|_next|health|.*\\..*).*)',
    ],
};
