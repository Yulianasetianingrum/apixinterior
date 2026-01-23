import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const response = NextResponse.next();

    // Add caching headers for static assets
    const path = request.nextUrl.pathname;

    // Cache images for 1 year
    if (path.match(/\.(jpg|jpeg|png|gif|webp|avif|svg|ico)$/)) {
        response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    }

    // Cache fonts for 1 year
    if (path.match(/\.(woff|woff2|ttf|otf|eot)$/)) {
        response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    }

    // Cache CSS/JS for 1 year (Next.js uses content hashes)
    if (path.match(/\/_next\/static\//)) {
        response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    }

    // Cache uploads for 1 hour (can be updated)
    if (path.startsWith('/uploads/')) {
        response.headers.set('Cache-Control', 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400');
    }

    // Security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    return response;
}

// Only run middleware on specific paths
export const config = {
    matcher: [
        // Match all paths except API routes and internal Next.js paths
        '/((?!api|_next/image|favicon.ico).*)',
    ],
};
