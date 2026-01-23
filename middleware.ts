import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // --- 1. ADMIN PROTECTION LOGIC ---
    if (pathname.startsWith("/admin")) {
        const cookie = request.cookies.get("admin_logged_in")?.value;
        const isAdmin = cookie === "true";

        // Halaman login admin selalu boleh diakses
        if (pathname.startsWith("/admin/admin_form")) {
            return NextResponse.next();
        }

        if (!isAdmin) {
            const loginUrl = new URL("/admin/admin_form", request.url);
            loginUrl.searchParams.set("from", pathname);
            return NextResponse.redirect(loginUrl);
        }
    }

    // --- 2. CACHING & SECURITY HEADERS (PERFORMANCE) ---
    const response = NextResponse.next();

    // Add caching headers for static assets
    // Cache images for 1 year
    if (pathname.match(/\.(jpg|jpeg|png|gif|webp|avif|svg|ico)$/)) {
        response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    }

    // Cache fonts for 1 year
    if (pathname.match(/\.(woff|woff2|ttf|otf|eot)$/)) {
        response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    }

    // Cache CSS/JS for 1 year (Next.js uses content hashes)
    if (pathname.match(/\/_next\/static\//)) {
        response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    }

    // Cache uploads for 1 hour
    if (pathname.startsWith('/uploads/')) {
        response.headers.set('Cache-Control', 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400');
    }

    // Security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    return response;
}

// Combine all paths that need either protection or caching
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/image|favicon.ico).*)',
    ],
};
