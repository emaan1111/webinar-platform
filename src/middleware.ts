import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Only add visitor cookie for split test routes if not present
  if (request.nextUrl.pathname.startsWith('/t/')) {
    const visitorId = request.cookies.get('webinar_visitor_id')?.value;
    
    if (!visitorId) {
      // Set a new visitor ID that persists for 30 days
      const newVisitorId = crypto.randomUUID();
      response.cookies.set('webinar_visitor_id', newVisitorId, {
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/',
        httpOnly: true, // Only accessible by server
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });
      
      // Also set the header so the downstream server component can read the NEW id immediately
      // (The server component reads cookies from request, which won't have the new cookie yet)
      response.headers.set('x-new-visitor-id', newVisitorId);
    }
  }

  return response;
}

export const config = {
  matcher: '/t/:path*',
};
