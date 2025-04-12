import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// 支持GET和POST请求
export async function GET() {
  return handleLogout();
}

export async function POST() {
  return handleLogout();
}

async function handleLogout() {
  try {
    // 创建响应
    const response = NextResponse.json({ 
      success: true,
      redirectTo: '/login'
    });
    
    // 清除auth cookie
    response.cookies.set({
      name: 'auth',
      value: '',
      httpOnly: true,
      expires: new Date(0),
      path: '/'
    });
    
    // 清除next-auth.session-token cookie
    response.cookies.set({
      name: 'next-auth.session-token',
      value: '',
      httpOnly: true,
      expires: new Date(0),
      path: '/'
    });
    
    // 清除next-auth.csrf-token cookie
    response.cookies.set({
      name: 'next-auth.csrf-token',
      value: '',
      httpOnly: true,
      expires: new Date(0),
      path: '/'
    });
    
    // 清除next-auth.callback-url cookie
    response.cookies.set({
      name: 'next-auth.callback-url',
      value: '',
      httpOnly: true,
      expires: new Date(0),
      path: '/'
    });
    
    return response;
  } catch (error) {
    // 不使用console.error，避免Edge Runtime问题
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to logout' 
    }, { status: 500 });
  }
}
