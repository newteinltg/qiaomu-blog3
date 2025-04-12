import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function GET(request: Request) {
  try {
    // 从URL参数中获取邮箱和密码
    const url = new URL(request.url);
    const email = url.searchParams.get('email');
    const password = url.searchParams.get('password');

    // 验证参数
    if (!email || !password) {
      return NextResponse.json({ 
        success: false, 
        error: '邮箱和密码是必需的' 
      }, { status: 400 });
    }

    if (!email.includes('@')) {
      return NextResponse.json({ 
        success: false, 
        error: '请提供有效的邮箱地址' 
      }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ 
        success: false, 
        error: '密码长度不能少于6位' 
      }, { status: 400 });
    }

    // 检查邮箱是否已存在
    const existingUser = await db.select({ count: sql`count(*)` })
      .from(sql`users`)
      .where(sql`email = ${email}`);

    if (existingUser[0].count > 0) {
      return NextResponse.json({ 
        success: false, 
        error: '该邮箱已被注册' 
      }, { status: 400 });
    }

    // 加密密码
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 创建管理员账户
    await db.execute(sql`
      INSERT INTO users (email, password)
      VALUES (${email}, ${hashedPassword});
    `);

    return NextResponse.json({ 
      success: true, 
      message: '管理员账户创建成功',
      email
    });
  } catch (error) {
    console.error('创建管理员账户失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: '创建管理员账户失败', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
