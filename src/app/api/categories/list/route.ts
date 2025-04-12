import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/schema';
import { eq, count } from 'drizzle-orm';

// 获取所有分类列表
export async function GET() {
  try {
    console.log('获取分类列表');

    // 先获取所有分类
    const allCategories = await db
      .select({
        id: schema.categories.id,
        name: schema.categories.name,
        slug: schema.categories.slug,
        description: schema.categories.description,
        parentId: schema.categories.parentId,
        order: schema.categories.order,
        createdAt: schema.categories.createdAt,
        updatedAt: schema.categories.updatedAt
      })
      .from(schema.categories)
      .orderBy(schema.categories.order)
      .all();

    // 获取每个分类的已发布文章数量
    const categoryCounts = await db
      .select({
        categoryId: schema.postCategories.categoryId,
        postCount: count(schema.postCategories.postId)
      })
      .from(schema.postCategories)
      .innerJoin(schema.posts, eq(schema.postCategories.postId, schema.posts.id))
      .where(eq(schema.posts.published, 1)) // 只计算已发布的文章
      .groupBy(schema.postCategories.categoryId)
      .all();

    // 创建分类ID到文章数量的映射
    const countMap = new Map();
    categoryCounts.forEach(item => {
      countMap.set(item.categoryId, item.postCount);
    });

    // 为每个分类添加文章数量
    const categoriesWithCounts = allCategories.map(category => ({
      ...category,
      postCount: countMap.get(category.id) || 0
    }));

    // 在管理界面中，我们需要返回所有分类，而不仅仅是有已发布文章的分类
    console.log(`成功获取 ${allCategories.length} 个分类`);

    return NextResponse.json(categoriesWithCounts);
  } catch (error) {
    console.error('获取分类列表失败:', error);
    return NextResponse.json(
      { error: '获取分类列表失败', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
