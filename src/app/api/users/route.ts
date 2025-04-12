import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

// 获取所有用户
export async function GET() {
  try {
    // 使用sqlite直接查询以确保返回数组
    const { sqlite } = await import('@/lib/db');
    const users = sqlite.prepare(`
      SELECT id, email, createdAt
      FROM users
      ORDER BY id ASC
    `).all();
    
    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    return NextResponse.json(
      { success: false, error: '获取用户列表失败' },
      { status: 500 }
    );
  }
}

// 创建新用户
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    // 验证输入
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: '邮箱和密码不能为空' },
        { status: 400 }
      );
    }
    
    // 使用sqlite直接查询检查邮箱是否已存在
    const { sqlite } = await import('@/lib/db');
    const existingUser = sqlite.prepare(`
      SELECT id FROM users WHERE email = ?
    `).get(email);
    
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: '该邮箱已被注册' },
        { status: 400 }
      );
    }
    
    // 加密密码
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // 创建用户
    sqlite.prepare(`
      INSERT INTO users (email, password, createdAt)
      VALUES (?, ?, datetime('now'))
    `).run(email, hashedPassword);
    
    return NextResponse.json({ success: true, message: '用户创建成功' });
  } catch (error) {
    console.error('创建用户失败:', error);
    return NextResponse.json(
      { success: false, error: '创建用户失败' },
      { status: 500 }
    );
  }
}
