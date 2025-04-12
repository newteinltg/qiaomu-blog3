import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contactInfo } from '@/lib/schema/settings';
import { eq } from 'drizzle-orm';

// 获取单个联系方式
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return NextResponse.json({ error: '无效的ID' }, { status: 400 });
    }
    
    const contact = await db.select().from(contactInfo).where(eq(contactInfo.id, id));
    
    if (!contact || contact.length === 0) {
      return NextResponse.json({ error: '联系方式不存在' }, { status: 404 });
    }
    
    return NextResponse.json(contact[0]);
  } catch (error) {
    console.error('获取联系方式失败:', error);
    return NextResponse.json({ error: '获取联系方式失败' }, { status: 500 });
  }
}

// 更新联系方式
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return NextResponse.json({ error: '无效的ID' }, { status: 400 });
    }
    
    const data = await request.json();
    
    // 验证必填字段
    if (!data.type || !data.value) {
      return NextResponse.json({ error: '类型和值为必填项' }, { status: 400 });
    }
    
    const updatedContact = await db.update(contactInfo)
      .set({
        type: data.type,
        value: data.value,
        qrCodeUrl: data.qrCodeUrl || null,
        displayName: data.displayName || null,
        isActive: data.isActive !== undefined ? data.isActive : 1,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(contactInfo.id, id))
      .returning();
    
    if (!updatedContact || updatedContact.length === 0) {
      return NextResponse.json({ error: '联系方式不存在' }, { status: 404 });
    }
    
    return NextResponse.json(updatedContact[0]);
  } catch (error) {
    console.error('更新联系方式失败:', error);
    return NextResponse.json({ error: '更新联系方式失败' }, { status: 500 });
  }
}

// 删除联系方式
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return NextResponse.json({ error: '无效的ID' }, { status: 400 });
    }
    
    const deletedContact = await db.delete(contactInfo)
      .where(eq(contactInfo.id, id))
      .returning();
    
    if (!deletedContact || deletedContact.length === 0) {
      return NextResponse.json({ error: '联系方式不存在' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除联系方式失败:', error);
    return NextResponse.json({ error: '删除联系方式失败' }, { status: 500 });
  }
}
