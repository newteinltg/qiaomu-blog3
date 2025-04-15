import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/schema';
import { desc, count, sql, eq } from 'drizzle-orm';

/**
 * 获取所有标签列表，支持分页
 * @param request 请求对象
 * @returns 响应对象
 */
export async function GET(request: NextRequest) {
  try {
    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);
    
    // 计算分页偏移量
    const offset = (page - 1) * pageSize;
    
    // 获取标签总数
    const totalCountResult = await db
      .select({ count: count() })
      .from(schema.tags)
      .all();
    
    const totalTags = totalCountResult[0]?.count || 0;
    const totalPages = Math.ceil(totalTags / pageSize);
    
    // 获取分页标签数据
    const tags = await db
      .select({
        id: schema.tags.id,
        name: schema.tags.name,
        slug: schema.tags.slug,
        description: schema.tags.description,
        postCount: count(schema.postTags.postId)
      })
      .from(schema.tags)
      .leftJoin(schema.postTags, eq(schema.tags.id, schema.postTags.tagId))
      .leftJoin(schema.posts, eq(schema.postTags.postId, schema.posts.id))
      .where(eq(schema.posts.published, 1)) // 只计算已发布的文章
      .groupBy(schema.tags.id)
      .orderBy(desc(count(schema.postTags.postId)))
      .limit(pageSize)
      .offset(offset)
      .all();
    
    return NextResponse.json({
      tags,
      pagination: {
        page,
        pageSize,
        totalTags,
        totalPages
      }
    });
  } catch (error) {
    console.error('获取标签列表失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: '获取标签列表失败', 
        error: String(error) 
      },
      { status: 500 }
    );
  }
}
