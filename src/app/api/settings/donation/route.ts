import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { donationInfo } from '@/lib/schema/settings';
import { eq } from 'drizzle-orm';

// 获取所有打赏信息
export async function GET() {
  try {
    const donations = await db.select().from(donationInfo);
    return NextResponse.json(donations);
  } catch (error) {
    console.error('获取打赏信息失败:', error);
    return NextResponse.json({ error: '获取打赏信息失败' }, { status: 500 });
  }
}

// 创建新的打赏信息
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // 验证必填字段
    if (!data.type || !data.qrCodeUrl) {
      return NextResponse.json({ error: '类型和二维码URL为必填项' }, { status: 400 });
    }
    
    const newDonation = await db.insert(donationInfo).values({
      type: data.type,
      qrCodeUrl: data.qrCodeUrl,
      description: data.description || null,
      isActive: data.isActive !== undefined ? data.isActive : 1,
    }).returning();
    
    return NextResponse.json(newDonation[0]);
  } catch (error) {
    console.error('创建打赏信息失败:', error);
    return NextResponse.json({ error: '创建打赏信息失败' }, { status: 500 });
  }
}
