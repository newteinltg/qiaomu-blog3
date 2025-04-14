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

// GET - 获取单个Webhook
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 初始化数据库连接
    const db = getDB();

    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: '无效的Webhook ID' },
        { status: 400 }
      );
    }

    const webhook = await db.select().from(webhooks).where(eq(webhooks.id, id)).limit(1);

    if (!webhook || webhook.length === 0) {
      return NextResponse.json(
        { error: 'Webhook不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      webhook: webhook[0]
    });
  } catch (error) {
    console.error('获取Webhook失败:', error);
    return NextResponse.json(
      { error: '获取Webhook失败', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// PUT - 更新Webhook
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 初始化数据库连接
    const db = getDB();

    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: '无效的Webhook ID' },
        { status: 400 }
      );
    }

    const data = await request.json();

    // 验证必填字段
    if (!data.url) {
      return NextResponse.json(
        { error: 'Webhook URL为必填项' },
        { status: 400 }
      );
    }

    // 检查Webhook是否存在
    const existingWebhook = await db.select().from(webhooks).where(eq(webhooks.id, id)).limit(1);

    if (!existingWebhook || existingWebhook.length === 0) {
      return NextResponse.json(
        { error: 'Webhook不存在' },
        { status: 404 }
      );
    }

    // 更新Webhook
    const result = await db.update(webhooks)
      .set({
        url: data.url,
        secret: data.secret || null,
        isActive: data.isActive !== undefined ? data.isActive : 1,
        updatedAt: new Date().toISOString()
      })
      .where(eq(webhooks.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      message: 'Webhook更新成功',
      webhook: result[0]
    });
  } catch (error) {
    console.error('更新Webhook失败:', error);
    return NextResponse.json(
      { error: '更新Webhook失败', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// DELETE - 删除Webhook
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 初始化数据库连接
    const db = getDB();

    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: '无效的Webhook ID' },
        { status: 400 }
      );
    }

    // 检查Webhook是否存在
    const existingWebhook = await db.select().from(webhooks).where(eq(webhooks.id, id)).limit(1);

    if (!existingWebhook || existingWebhook.length === 0) {
      return NextResponse.json(
        { error: 'Webhook不存在' },
        { status: 404 }
      );
    }

    // 删除Webhook
    await db.delete(webhooks).where(eq(webhooks.id, id));

    return NextResponse.json({
      success: true,
      message: 'Webhook删除成功'
    });
  } catch (error) {
    console.error('删除Webhook失败:', error);
    return NextResponse.json(
      { error: '删除Webhook失败', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
