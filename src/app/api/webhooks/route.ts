import { NextRequest, NextResponse } from 'next/server';
import { webhooks } from '@/lib/schema/links';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import path from 'path';

// 初始化数据库连接
function getDB() {
  try {
    const dbPath = path.join(process.cwd(), 'links.db');
    const sqlite = new Database(dbPath);
    return drizzle(sqlite);
  } catch (error) {
    console.error('Failed to connect to links database:', error);
    throw new Error('数据库连接失败');
  }
}

// GET - 获取所有Webhook
export async function GET() {
  try {
    // 初始化数据库连接
    const db = getDB();

    const allWebhooks = await db.select().from(webhooks);

    return NextResponse.json({
      success: true,
      webhooks: allWebhooks
    });
  } catch (error) {
    console.error('获取Webhook列表失败:', error);
    return NextResponse.json(
      { error: '获取Webhook列表失败', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// POST - 创建新Webhook
export async function POST(request: NextRequest) {
  try {
    // 初始化数据库连接
    const db = getDB();

    const data = await request.json();

    // 验证必填字段
    if (!data.url) {
      return NextResponse.json(
        { error: 'Webhook URL为必填项' },
        { status: 400 }
      );
    }

    // 创建新Webhook
    const result = await db.insert(webhooks).values({
      url: data.url,
      secret: data.secret || null,
      isActive: data.isActive !== undefined ? data.isActive : 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }).returning();

    return NextResponse.json({
      success: true,
      message: 'Webhook创建成功',
      webhook: result[0]
    });
  } catch (error) {
    console.error('创建Webhook失败:', error);
    return NextResponse.json(
      { error: '创建Webhook失败', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
