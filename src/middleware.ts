import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;
  
  // Check if the path is for admin routes
  const isAdminPath = path.startsWith('/admin');
  
  if (isAdminPath) {
    // Get the session token using NextAuth
    const session = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });
    
    // If no session exists, redirect to login
    if (!session) {
      console.log('No session found, redirecting to login');
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    console.log('User authenticated, proceeding to admin');
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*']
};
