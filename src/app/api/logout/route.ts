import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    // Create the response
    const response = NextResponse.json({ 
      success: true,
      redirectTo: '/login'
    });
    
    // Clear the auth cookie in the response
    response.cookies.set({
      name: 'auth',
      value: '',
      httpOnly: true,
      expires: new Date(0),
      path: '/'
    });
    
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to logout' 
    }, { status: 500 });
  }
}
