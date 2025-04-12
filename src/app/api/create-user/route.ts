import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/schema';
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

    // 对密码进行哈希处理
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const result = await db.insert(schema.users).values({
      email,
      password: hashedPassword,
    }).returning();

    return NextResponse.json({
      message: '用户创建成功',
      user: {
        id: result[0].id,
        email: result[0].email
      }
    });
  } catch (error) {
    console.error('创建用户错误:', error);
    return NextResponse.json(
      { 
        error: '创建用户失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}
