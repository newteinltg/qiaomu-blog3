import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contactInfo } from '@/lib/schema/settings';
import { eq } from 'drizzle-orm';

// 获取所有联系方式
export async function GET() {
  try {
    const contacts = await db.select().from(contactInfo);
    return NextResponse.json(contacts);
  } catch (error) {
    console.error('获取联系方式失败:', error);
    return NextResponse.json({ error: '获取联系方式失败' }, { status: 500 });
  }
}

// 创建新的联系方式
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // 验证必填字段
    if (!data.type || !data.value) {
      return NextResponse.json({ error: '类型和值为必填项' }, { status: 400 });
    }
    
    const newContact = await db.insert(contactInfo).values({
      type: data.type,
      value: data.value,
      qrCodeUrl: data.qrCodeUrl || null,
      displayName: data.displayName || null,
      isActive: data.isActive !== undefined ? data.isActive : 1,
    }).returning();
    
    return NextResponse.json(newContact[0]);
  } catch (error) {
    console.error('创建联系方式失败:', error);
    return NextResponse.json({ error: '创建联系方式失败' }, { status: 500 });
  }
}
