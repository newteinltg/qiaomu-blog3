import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/schema';
import { eq } from 'drizzle-orm';

// 获取所有网站设置
export async function GET(request: Request) {
  try {
    // 获取网站基本设置
    const siteSettings = await db
      .select()
      .from(schema.siteSettings)
      .all();

    // 将设置转换为键值对对象
    const settingsMap = {};
    if (siteSettings && siteSettings.length > 0) {
      for (const setting of siteSettings) {
        settingsMap[setting.key] = setting.value;
      }
    }

    // 获取社交媒体链接
    const socialLinks = await db
      .select()
      .from(schema.socialLinks)
      .where(eq(schema.socialLinks.isActive, 1))
      .orderBy(schema.socialLinks.order)
      .all();

    // 获取联系方式
    const contactInfo = await db
      .select()
      .from(schema.contactInfo)
      .where(eq(schema.contactInfo.isActive, 1))
      .all();

    // 获取打赏信息
    const donationInfo = await db
      .select()
      .from(schema.donationInfo)
      .where(eq(schema.donationInfo.isActive, 1))
      .all();

    // 获取Hero区域设置
    const heroSettings = await db
      .select()
      .from(schema.heroSettings)
      .where(eq(schema.heroSettings.isActive, 1))
      .limit(1)
      .all();

    // 返回所有设置
    return NextResponse.json({
      success: true,
      data: {
        settings: settingsMap,
        socialLinks,
        contactInfo,
        donationInfo,
        hero: heroSettings[0] || null,
      }
    });
  } catch (error) {
    console.error('获取网站设置失败:', error);
    return NextResponse.json(
      { success: false, error: '获取网站设置失败' },
      { status: 500 }
    );
  }
}
