import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { headScripts } from '@/lib/schema/settings';

/**
 * 获取指定位置的脚本
 * @param request 请求对象
 * @returns 响应对象
 */
export async function GET(request: NextRequest) {
  console.log('[API /api/settings/scripts/position] Received request');
  try {
    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const position = searchParams.get('position');
    console.log(`[API /api/settings/scripts/position] Position requested: ${position}`);

    if (!position) {
      console.warn('[API /api/settings/scripts/position] Position parameter missing');
      return NextResponse.json({ success: false, message: '缺少位置参数' }, { status: 400 });
    }

    // 获取指定位置的脚本
    console.log(`[API /api/settings/scripts/position] Querying database for position: ${position}`);
    const scripts = await db
      .select({
        id: headScripts.id,
        content: headScripts.code,
        position: headScripts.position,
      })
      .from(headScripts)
      .where(
        and(
          eq(headScripts.position, position),
          eq(headScripts.isActive, 1)
        )
      );

    console.log(`[API /api/settings/scripts/position] Database query returned ${scripts.length} scripts for position: ${position}`);
    // console.log('[API /api/settings/scripts/position] Scripts data:', JSON.stringify(scripts)); // Optional: Uncomment for detailed data

    return NextResponse.json({
      success: true,
      scripts,
    });
  } catch (error) {
    console.error(`[API /api/settings/scripts/position] Error fetching scripts:`, error);
    return NextResponse.json(
      {
        success: false,
        message: '获取脚本失败',
        error: String(error)
      },
      { status: 500 }
    );
  }
}
