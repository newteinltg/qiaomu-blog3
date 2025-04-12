import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import * as schema from '@/lib/schema';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    
    console.log('Login attempt:', email);
    
    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: '邮箱和密码不能为空' },
        { status: 400 }
      );
    }
    
    // Get user from database
    const users = await db.select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .all();
    
    const user = users[0];
    
    if (!user) {
      console.log('User not found');
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 401 }
      );
    }
    
    // Verify password
    let isPasswordValid = false;
    
    try {
      // Try bcrypt first
      isPasswordValid = await bcrypt.compare(password, user.password);
    } catch (error) {
      // If bcrypt fails, try direct comparison as fallback
      isPasswordValid = user.password === password;
    }
    
    if (!isPasswordValid) {
      console.log('Invalid password');
      return NextResponse.json(
        { error: '密码不正确' },
        { status: 401 }
      );
    }
    
    // Create the response
    const response = NextResponse.json({ success: true });
    
    // Set auth cookie in the response
    response.cookies.set({
      name: 'auth',
      value: JSON.stringify({
        id: user.id,
        email: user.email,
        isLoggedIn: true
      }),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/'
    });
    
    console.log('Login successful');
    
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: '登录过程中发生错误' },
      { status: 500 }
    );
  }
}
