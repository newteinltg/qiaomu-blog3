import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

// 获取单个用户
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    
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
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
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
    
    // 准备更新数据
    let updateQuery = 'UPDATE users SET email = ?';
    let queryParams = [email];
    
    // 如果提供了新密码，则哈希处理
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      updateQuery += ', password = ?';
      queryParams.push(hashedPassword);
    }
    
    updateQuery += ' WHERE id = ?';
    queryParams.push(userId);
    
    // 执行更新
    sqlite.prepare(updateQuery).run(...queryParams);
    
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
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    
    // 检查用户是否存在
    const { sqlite } = await import('@/lib/db');
    const existingUser = sqlite.prepare(`
      SELECT id, email FROM users WHERE id = ?
    `).get(userId);
    
    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: '用户不存在' },
        { status: 404 }
      );
    }
    
    // 检查是否是最后一个管理员账户
    const adminCount = sqlite.prepare(`
      SELECT COUNT(*) as count FROM users
    `).get() as { count: number };
    
    if (adminCount.count <= 1) {
      return NextResponse.json(
        { success: false, error: '无法删除最后一个管理员账户' },
        { status: 400 }
      );
    }
    
    // 执行删除
    sqlite.prepare(`DELETE FROM users WHERE id = ?`).run(userId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除用户失败:', error);
    return NextResponse.json(
      { success: false, error: '删除用户失败' },
      { status: 500 }
    );
  }
}
