import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/schema';
import { eq, inArray } from 'drizzle-orm';

// GET 获取文章的所有分类
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 获取文章ID
    const { id } = await params;
    const postId = parseInt(id);
    
    if (isNaN(postId)) {
      return NextResponse.json(
        { error: 'Invalid post ID' },
        { status: 400 }
      );
    }

    // 检查文章是否存在
    const post = await db.query.posts.findFirst({
      where: eq(schema.posts.id, postId)
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // 获取文章的分类关联
    const postCategories = await db.query.postCategories.findMany({
      where: eq(schema.postCategories.postId, postId),
      with: {
        category: true
      }
    });

    // 提取分类信息
    const categories = postCategories.map(pc => pc.category);

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching post categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch post categories' },
      { status: 500 }
    );
  }
}

// POST 创建文章的分类关联
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 获取文章ID
    const { id } = await params;
    const postId = parseInt(id);
    
    // 获取并验证请求体
    const requestBody = await request.json();
    
    if (!requestBody || !requestBody.categoryIds) {
      return NextResponse.json(
        { error: 'Missing categoryIds field in request body' },
        { status: 400 }
      );
    }
    
    const { categoryIds } = requestBody;

    if (isNaN(postId)) {
      return NextResponse.json(
        { error: 'Invalid post ID' },
        { status: 400 }
      );
    }

    if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
      return NextResponse.json(
        { error: 'Category IDs are required and must be an array' },
        { status: 400 }
      );
    }
    
    // 确保所有分类ID都是数字
    const numericCategoryIds = categoryIds.map(id => 
      typeof id === 'string' ? parseInt(id, 10) : id
    ).filter(id => !isNaN(id));
    
    if (numericCategoryIds.length === 0) {
      return NextResponse.json(
        { error: 'No valid category IDs provided' },
        { status: 400 }
      );
    }
    
    console.log(`处理文章 ${postId} 的分类关联，分类IDs:`, numericCategoryIds);

    // 检查文章是否存在
    const post = await db.query.posts.findFirst({
      where: eq(schema.posts.id, postId)
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // 检查分类是否存在
    const categories = await db.query.categories.findMany({
      where: inArray(schema.categories.id, numericCategoryIds)
    });

    if (categories.length !== numericCategoryIds.length) {
      const foundIds = categories.map(c => c.id);
      const missingIds = numericCategoryIds.filter(id => !foundIds.includes(id));
      
      console.warn(`部分分类未找到: ${missingIds.join(', ')}`);
      
      return NextResponse.json(
        { 
          error: 'One or more categories not found',
          missingIds
        },
        { status: 404 }
      );
    }

    try {
      // 创建文章与分类的关联
      // 注意：数据库模式中的表名是 post_categories，字段名是 postId 和 categoryId
      // 但表中的外键约束可能没有 ON DELETE CASCADE
      const postCategoryValues = numericCategoryIds.map(categoryId => ({
        postId, // 确保与数据库模式中的字段名一致
        categoryId // 确保与数据库模式中的字段名一致
      }));

      console.log('插入分类关联数据:', postCategoryValues);

      // 首先检查是否已存在相同的关联，避免主键冲突
      try {
        // 使用事务来确保操作的原子性
        await db.transaction(async (tx) => {
          // 1. 删除现有关联
          await tx
            .delete(schema.postCategories)
            .where(eq(schema.postCategories.postId, postId));
          
          // 2. 插入新关联
          if (postCategoryValues.length > 0) {
            await tx.insert(schema.postCategories).values(postCategoryValues);
          }
        });
        
        console.log(`成功为文章 ${postId} 关联 ${numericCategoryIds.length} 个分类`);
      } catch (dbError) {
        console.error('数据库事务错误:', dbError);
        throw dbError;
      }
      
      // 获取更新后的分类列表
      const updatedPostCategories = await db.query.postCategories.findMany({
        where: eq(schema.postCategories.postId, postId),
        with: {
          category: true
        }
      });

      const updatedCategories = updatedPostCategories.map(pc => pc.category);

      return NextResponse.json(updatedCategories);
    } catch (dbError) {
      console.error('数据库错误:', dbError);
      return NextResponse.json(
        { error: 'Database error creating category associations' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error creating post category associations:', error);
    return NextResponse.json(
      { error: 'Failed to create post category associations' },
      { status: 500 }
    );
  }
}

// PUT 更新文章的分类
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 获取文章ID
    const { id } = await params;
    const postId = parseInt(id);
    const { categoryIds } = await request.json();

    if (isNaN(postId)) {
      return NextResponse.json(
        { error: 'Invalid post ID' },
        { status: 400 }
      );
    }

    if (!Array.isArray(categoryIds)) {
      return NextResponse.json(
        { error: 'Category IDs must be an array' },
        { status: 400 }
      );
    }

    // 检查文章是否存在
    const post = await db.query.posts.findFirst({
      where: eq(schema.posts.id, postId)
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // 如果有分类ID，检查分类是否存在
    if (categoryIds.length > 0) {
      const categories = await db.query.categories.findMany({
        where: inArray(schema.categories.id, categoryIds)
      });

      if (categories.length !== categoryIds.length) {
        return NextResponse.json(
          { error: 'One or more categories not found' },
          { status: 404 }
        );
      }
    }

    // 删除现有的分类关联
    await db
      .delete(schema.postCategories)
      .where(eq(schema.postCategories.postId, postId));

    // 如果有新的分类ID，创建新的关联
    if (categoryIds.length > 0) {
      const postCategoryValues = categoryIds.map(categoryId => ({
        postId,
        categoryId
      }));

      await db.insert(schema.postCategories).values(postCategoryValues);
    }

    // 获取更新后的分类列表
    const updatedPostCategories = await db.query.postCategories.findMany({
      where: eq(schema.postCategories.postId, postId),
      with: {
        category: true
      }
    });

    const updatedCategories = updatedPostCategories.map(pc => pc.category);

    return NextResponse.json(updatedCategories);
  } catch (error) {
    console.error('Error updating post categories:', error);
    return NextResponse.json(
      { error: 'Failed to update post categories' },
      { status: 500 }
    );
  }
}
