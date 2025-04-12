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
    
    // 验证输入
    if (!email) {
      return NextResponse.json(
        { success: false, error: '邮箱不能为空' },
        { status: 400 }
      );
    }
    
    // 使用sqlite直接查询检查用户是否存在
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
    const emailCheck = sqlite.prepare(`
      SELECT id FROM users WHERE email = ? AND id != ?
    `).get(email, userId);
    
    if (emailCheck) {
      return NextResponse.json(
        { success: false, error: '该邮箱已被其他用户使用' },
        { status: 400 }
      );
    }
    
    // 更新用户信息
    if (password) {
      // 如果提供了密码，则更新密码
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      sqlite.prepare(`
        UPDATE users
        SET email = ?, password = ?
        WHERE id = ?
      `).run(email, hashedPassword, userId);
    } else {
      // 如果没有提供密码，只更新邮箱
      sqlite.prepare(`
        UPDATE users
        SET email = ?
        WHERE id = ?
      `).run(email, userId);
    }
    
    return NextResponse.json({ success: true, message: '用户更新成功' });
  } catch (error) {
    console.error('更新用户失败:', error);
    return NextResponse.json(
      { success: false, error: '更新用户失败' },
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
    
    // 使用sqlite直接查询检查用户是否存在
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
    
    // 检查是否是唯一管理员
    const userCount = sqlite.prepare(`
      SELECT COUNT(*) as count FROM users
    `).get() as { count: number };
    
    if (userCount.count <= 1) {
      return NextResponse.json(
        { success: false, error: '系统必须保留至少一个管理员账户' },
        { status: 400 }
      );
    }
    
    // 删除用户
    sqlite.prepare(`
      DELETE FROM users
      WHERE id = ?
    `).run(userId);
    
    return NextResponse.json({ success: true, message: '用户删除成功' });
  } catch (error) {
    console.error('删除用户失败:', error);
    return NextResponse.json(
      { success: false, error: '删除用户失败' },
      { status: 500 }
    );
  }
}
