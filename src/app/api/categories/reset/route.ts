import { NextResponse } from 'next/server';
import { db, sqlite } from '@/lib/db';
import * as schema from '@/lib/schema';
import { eq, ne, isNotNull } from 'drizzle-orm';

/**
 * 重置分类数据
 * 此 API 将删除所有分类数据并创建新的默认分类
 */
export async function POST() {
  try {
    console.log('开始重置分类数据...');
    
    // 检查是否有文章使用分类
    const postsWithCategories = await db.query.posts.findMany({
      where: (posts) => 
        isNotNull(posts.categoryId)
    });
    
    if (postsWithCategories.length > 0) {
      console.log('有文章使用分类，将文章的分类设置为 null');
      
      // 将所有文章的分类设置为 null
      for (const post of postsWithCategories) {
        await db
          .update(schema.posts)
          .set({ categoryId: null })
          .where(eq(schema.posts.id, post.id));
      }
    }
    
    // 使用原始 SQL 删除所有分类数据
    console.log('删除所有分类数据...');
    await sqlite.exec('DELETE FROM categories');
    
    // 重置自增 ID
    await sqlite.exec('DELETE FROM sqlite_sequence WHERE name = "categories"');
    
    // 创建新的默认分类
    console.log('创建新的默认分类...');
    const defaultCategories = [
      {
        name: '未分类',
        slug: 'uncategorized',
        description: '默认分类',
        parentId: null,
        order: 0
      },
      {
        name: '技术',
        slug: 'technology',
        description: '技术相关文章',
        parentId: null,
        order: 10
      },
      {
        name: '生活',
        slug: 'life',
        description: '生活相关文章',
        parentId: null,
        order: 20
      }
    ];
    
    // 插入默认分类
    for (const category of defaultCategories) {
      await db.insert(schema.categories).values({
        name: category.name,
        slug: category.slug,
        description: category.description,
        parentId: category.parentId,
        order: category.order
      });
    }
    
    console.log('分类数据重置完成');
    
    return NextResponse.json({
      success: true,
      message: '分类数据已成功重置',
      categories: await db.query.categories.findMany()
    });
  } catch (error) {
    console.error('重置分类数据失败:', error);
    return NextResponse.json(
      { error: '重置分类数据失败', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
