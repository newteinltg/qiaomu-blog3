import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { headScripts } from '@/lib/schema/settings';
import { eq } from 'drizzle-orm';

// 获取所有脚本
export async function GET() {
  try {
    console.log('API: 开始获取脚本');
    const scripts = await db.select().from(headScripts).orderBy(headScripts.order);
    console.log('API: 获取到脚本数量:', scripts.length);
    console.log('API: 脚本列表:', scripts);

    return NextResponse.json({
      success: true,
      data: {
        scripts
      }
    });
  } catch (error) {
    console.error('API: 获取脚本失败:', error);
    return NextResponse.json({ error: '获取脚本失败' }, { status: 500 });
  }
}

// 创建新脚本
export async function POST(request: Request) {
  try {
    const data = await request.json();

    // 验证必填字段
    if (!data.name || !data.code) {
      return NextResponse.json({ error: '名称和代码是必填项' }, { status: 400 });
    }

    // 创建新脚本
    const result = await db.insert(headScripts).values({
      name: data.name,
      description: data.description || null,
      code: data.code,
      type: data.type || 'custom',
      isActive: data.isActive !== undefined ? data.isActive : 1,
      position: data.position || 'head',
      pages: data.pages || null,
      order: data.order || 0,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: '脚本创建成功',
      data: result
    });
  } catch (error) {
    console.error('创建脚本失败:', error);
    return NextResponse.json({ error: '创建脚本失败' }, { status: 500 });
  }
}
