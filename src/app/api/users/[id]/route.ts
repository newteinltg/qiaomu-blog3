import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

// 获取单个用户
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 获取用户ID
    const { id } = await params;
    const numId = parseInt(id);
    
    // 使用sqlite直接查询以确保返回正确的数据格式
    const { sqlite } = await import('@/lib/db');
    const user = sqlite.prepare(`
      SELECT id, email, createdAt
      FROM users
      WHERE id = ?
    `).get(numId);
    
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 获取用户ID
    const { id } = await params;
    const numId = parseInt(id);
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
    `).get(numId);
    
    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: '用户不存在' },
        { status: 404 }
      );
    }
    
    // 检查邮箱是否已被其他用户使用
    const emailExists = sqlite.prepare(`
      SELECT id FROM users WHERE email = ? AND id != ?
    `).get(email, numId);
    
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
      `).run(email, hashedPassword, numId);
    } else {
      // 否则只更新邮箱
      sqlite.prepare(`
        UPDATE users
        SET email = ?
        WHERE id = ?
      `).run(email, numId);
    }
    
    // 获取更新后的用户信息
    const updatedUser = sqlite.prepare(`
      SELECT id, email, createdAt
      FROM users
      WHERE id = ?
    `).get(numId);
    
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 获取用户ID
    const { id } = await params;
    const numId = parseInt(id);
    
    // 检查用户是否存在
    const { sqlite } = await import('@/lib/db');
    const existingUser = sqlite.prepare(`
      SELECT id FROM users WHERE id = ?
    `).get(numId);
    
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
    `).run(numId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除用户失败:', error);
    return NextResponse.json(
      { success: false, error: '删除用户失败' },
      { status: 500 }
    );
  }
}
