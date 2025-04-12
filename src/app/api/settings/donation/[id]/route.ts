import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { donationInfo } from '@/lib/schema/settings';
import { eq } from 'drizzle-orm';

// 获取单个打赏信息
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
    
    const donation = await db.select().from(donationInfo).where(eq(donationInfo.id, id));
    
    if (!donation || donation.length === 0) {
      return NextResponse.json({ error: '打赏信息不存在' }, { status: 404 });
    }
    
    return NextResponse.json(donation[0]);
  } catch (error) {
    console.error('获取打赏信息失败:', error);
    return NextResponse.json({ error: '获取打赏信息失败' }, { status: 500 });
  }
}

// 更新打赏信息
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
    if (!data.type || !data.qrCodeUrl) {
      return NextResponse.json({ error: '类型和二维码URL为必填项' }, { status: 400 });
    }
    
    const updatedDonation = await db.update(donationInfo)
      .set({
        type: data.type,
        qrCodeUrl: data.qrCodeUrl,
        description: data.description || null,
        isActive: data.isActive !== undefined ? data.isActive : 1,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(donationInfo.id, id))
      .returning();
    
    if (!updatedDonation || updatedDonation.length === 0) {
      return NextResponse.json({ error: '打赏信息不存在' }, { status: 404 });
    }
    
    return NextResponse.json(updatedDonation[0]);
  } catch (error) {
    console.error('更新打赏信息失败:', error);
    return NextResponse.json({ error: '更新打赏信息失败' }, { status: 500 });
  }
}

// 删除打赏信息
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
    
    const deletedDonation = await db.delete(donationInfo)
      .where(eq(donationInfo.id, id))
      .returning();
    
    if (!deletedDonation || deletedDonation.length === 0) {
      return NextResponse.json({ error: '打赏信息不存在' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除打赏信息失败:', error);
    return NextResponse.json({ error: '删除打赏信息失败' }, { status: 500 });
  }
}
