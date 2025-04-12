import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { siteSettings } from '@/lib/schema/settings';
import { eq } from 'drizzle-orm';

// 获取所有网站基本设置
export async function GET() {
  try {
    const settings = await db.select().from(siteSettings);

    // 将设置转换为键值对对象
    const settingsMap: Record<string, string | null> = {};
    if (settings && settings.length > 0) {
      for (const setting of settings) {
        settingsMap[setting.key] = setting.value;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        settings: settingsMap
      }
    });
  } catch (error) {
    console.error('获取网站设置失败:', error);
    return NextResponse.json({ error: '获取网站设置失败' }, { status: 500 });
  }
}

// 保存网站基本设置
export async function POST(request: Request) {
  try {
    const data = await request.json();

    // 确保 data 不为 null 或 undefined
    if (!data) {
      return NextResponse.json({ error: '无效的设置数据' }, { status: 400 });
    }

    // 遍历所有设置项并保存
    for (const [key, value] of Object.entries(data)) {
      // 检查设置是否已存在
      const existingSetting = await db.select()
        .from(siteSettings)
        .where(eq(siteSettings.key, key))
        .limit(1);

      if (existingSetting.length > 0) {
        // 更新现有设置
        await db.update(siteSettings)
          .set({
            value: value as string,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(siteSettings.key, key));
      } else {
        // 创建新设置
        await db.insert(siteSettings).values({
          key,
          value: value as string,
          group: 'general',
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: '网站设置保存成功'
    });
  } catch (error) {
    console.error('保存网站设置失败:', error);
    return NextResponse.json({ error: '保存网站设置失败' }, { status: 500 });
  }
}
