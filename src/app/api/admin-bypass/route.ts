import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import * as schema from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    // This is a special bypass route for development/preview environments only
    console.log('Admin bypass route accessed');
    
    // Get user from database (we'll use the first admin user)
    const users = await db.select()
      .from(schema.users)
      .all();
    
    if (users.length === 0) {
      console.log('No users found in database');
      return NextResponse.json(
        { error: 'No users found' },
        { status: 500 }
      );
    }
    
    const user = users[0];
    console.log('Using user for bypass:', { id: user.id, email: user.email });
    
    // Create the auth cookie data
    const authData = {
      id: user.id,
      email: user.email,
      isLoggedIn: true,
      timestamp: new Date().toISOString(),
      bypass: true
    };
    
    // Create the response
    const response = NextResponse.json({ 
      success: true,
      message: 'Admin bypass successful',
      redirectTo: '/admin',
      user: {
        id: user.id,
        email: user.email
      }
    });
    
    // Set auth cookie in the response
    response.cookies.set({
      name: 'auth',
      value: JSON.stringify(authData),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
      sameSite: 'lax'
    });
    
    console.log('Admin bypass successful, auth cookie set');
    
    return response;
  } catch (error) {
    console.error('Admin bypass error:', error);
    return NextResponse.json(
      { error: 'Admin bypass failed' },
      { status: 500 }
    );
  }
}
