import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { headScripts } from '@/lib/schema/settings';
import { eq } from 'drizzle-orm';

// 获取单个脚本
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: '无效的ID' }, { status: 400 });
    }

    const script = await db.select()
      .from(headScripts)
      .where(eq(headScripts.id, id))
      .limit(1);

    if (script.length === 0) {
      return NextResponse.json({ error: '脚本不存在' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        script: script[0]
      }
    });
  } catch (error) {
    console.error('获取脚本失败:', error);
    return NextResponse.json({ error: '获取脚本失败' }, { status: 500 });
  }
}

// 更新脚本
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: '无效的ID' }, { status: 400 });
    }

    const data = await request.json();

    // 验证必填字段
    if (!data.name || !data.code) {
      return NextResponse.json({ error: '名称和代码是必填项' }, { status: 400 });
    }

    // 检查脚本是否存在
    const existingScript = await db.select()
      .from(headScripts)
      .where(eq(headScripts.id, id))
      .limit(1);

    if (existingScript.length === 0) {
      return NextResponse.json({ error: '脚本不存在' }, { status: 404 });
    }

    // 更新脚本
    await db.update(headScripts)
      .set({
        name: data.name,
        description: data.description || null,
        code: data.code,
        type: data.type || 'custom',
        isActive: data.isActive !== undefined ? data.isActive : 1,
        position: data.position || 'head',
        pages: data.pages || null,
        order: data.order || 0,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(headScripts.id, id));

    return NextResponse.json({
      success: true,
      message: '脚本更新成功'
    });
  } catch (error) {
    console.error('更新脚本失败:', error);
    return NextResponse.json({ error: '更新脚本失败' }, { status: 500 });
  }
}

// 删除脚本
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: '无效的ID' }, { status: 400 });
    }

    // 检查脚本是否存在
    const existingScript = await db.select()
      .from(headScripts)
      .where(eq(headScripts.id, id))
      .limit(1);

    if (existingScript.length === 0) {
      return NextResponse.json({ error: '脚本不存在' }, { status: 404 });
    }

    // 删除脚本
    await db.delete(headScripts)
      .where(eq(headScripts.id, id));

    return NextResponse.json({
      success: true,
      message: '脚本删除成功'
    });
  } catch (error) {
    console.error('删除脚本失败:', error);
    return NextResponse.json({ error: '删除脚本失败' }, { status: 500 });
  }
}
