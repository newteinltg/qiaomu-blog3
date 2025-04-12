import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

// 获取单个用户
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const userId = context.params.id;
    
    // 使用sqlite直接查询以确保返回正确的数据格式
    const { sqlite } = await import('@/lib/db');
    const user = sqlite.prepare(`
      SELECT id, email, createdAt
      FROM users
      WHERE id = ?
    `).get(userId);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: '用户不存在' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return NextResponse.json(
      { success: false, error: '获取用户信息失败' },
      { status: 500 }
    );
  }
}

// 更新用户
export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const userId = context.params.id;
    const { email, password } = await request.json();
    
    // 验证请求数据
    if (!email) {
      return NextResponse.json(
        { success: false, error: '邮箱不能为空' },
        { status: 400 }
      );
    }
    
    // 检查用户是否存在
    const { sqlite } = await import('@/lib/db');
    const existingUser = sqlite.prepare(`
      SELECT id FROM users WHERE id = ?
    `).get(userId);
    
    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: '用户不存在' },
        { status: 404 }
      );
    }
    
    // 检查邮箱是否已被其他用户使用
    const emailExists = sqlite.prepare(`
      SELECT id FROM users WHERE email = ? AND id != ?
    `).get(email, userId);
    
    if (emailExists) {
      return NextResponse.json(
        { success: false, error: '邮箱已被使用' },
        { status: 400 }
      );
    }
    
    // 更新用户信息
    if (password) {
      // 如果提供了新密码，则更新密码
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      sqlite.prepare(`
        UPDATE users
        SET email = ?, password = ?
        WHERE id = ?
      `).run(email, hashedPassword, userId);
    } else {
      // 否则只更新邮箱
      sqlite.prepare(`
        UPDATE users
        SET email = ?
        WHERE id = ?
      `).run(email, userId);
    }
    
    // 获取更新后的用户信息
    const updatedUser = sqlite.prepare(`
      SELECT id, email, createdAt
      FROM users
      WHERE id = ?
    `).get(userId);
    
    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('更新用户信息失败:', error);
    return NextResponse.json(
      { success: false, error: '更新用户信息失败' },
      { status: 500 }
    );
  }
}

// 删除用户
export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const userId = context.params.id;
    
    // 检查用户是否存在
    const { sqlite } = await import('@/lib/db');
    const existingUser = sqlite.prepare(`
      SELECT id FROM users WHERE id = ?
    `).get(userId);
    
    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: '用户不存在' },
        { status: 404 }
      );
    }
    
    // 获取系统中的所有管理员用户数量
    const adminCount = sqlite.prepare(`
      SELECT COUNT(*) as count FROM users
    `).get() as { count: number };
    
    // 如果只有一个管理员，不允许删除
    if (adminCount.count <= 1) {
      return NextResponse.json(
        { success: false, error: '系统中至少需要保留一个管理员账户' },
        { status: 400 }
      );
    }
    
    // 删除用户
    sqlite.prepare(`
      DELETE FROM users WHERE id = ?
    `).run(userId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除用户失败:', error);
    return NextResponse.json(
      { success: false, error: '删除用户失败' },
      { status: 500 }
    );
  }
}
