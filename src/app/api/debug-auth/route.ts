import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/schema';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Missing email or password' },
        { status: 400 }
      );
    }

    // 查找用户
    const users = await db.select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .all();

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'User not found', status: 'error' },
        { status: 404 }
      );
    }

    const user = users[0];

    // 检查密码是否存在
    if (!user.password) {
      return NextResponse.json(
        { error: 'User has no password stored', status: 'error' },
        { status: 400 }
      );
    }

    // 尝试使用bcrypt验证密码
    let isPasswordValid = false;
    let bcryptError = null;

    try {
      isPasswordValid = await bcrypt.compare(password, user.password);
    } catch (error) {
      bcryptError = error instanceof Error ? error.message : 'Unknown bcrypt error';
      // 如果bcrypt失败，尝试直接比较
      isPasswordValid = user.password === password;
    }

    if (!isPasswordValid) {
      return NextResponse.json({
        error: 'Invalid password',
        status: 'error',
        passwordInfo: {
          providedPasswordLength: password.length,
          storedPasswordType: typeof user.password,
          storedPasswordLength: user.password.length,
          storedPasswordStart: user.password.substring(0, 5) + '...',
          bcryptError
        }
      }, { status: 401 });
    }

    return NextResponse.json({
      message: 'Authentication successful',
      status: 'success',
      user: {
        id: user.id,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Debug auth error:', error);
    return NextResponse.json(
      { 
        error: 'Authentication error',
        details: error instanceof Error ? error.message : 'Unknown error',
        status: 'error'
      },
      { status: 500 }
    );
  }
}
