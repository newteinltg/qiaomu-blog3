import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/schema';
import { eq, inArray } from 'drizzle-orm';

// GET 获取文章的所有分类
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    // 获取文章的所有分类
    const postCategoriesRelations = await db
      .select()
      .from(schema.postCategories)
      .where(eq(schema.postCategories.postId, postId));

    if (!postCategoriesRelations.length) {
      // 如果没有在关联表中找到，但文章有主分类，则返回主分类
      if (post.categoryId) {
        const mainCategory = await db
          .select()
          .from(schema.categories)
          .where(eq(schema.categories.id, post.categoryId))
          .limit(1);

        if (mainCategory.length > 0) {
          return NextResponse.json([mainCategory[0]]);
        }
      }
      return NextResponse.json([]);
    }

    // 获取分类详情
    const categoryIds = postCategoriesRelations.map(relation => relation.categoryId);
    const categories = await db
      .select()
      .from(schema.categories)
      .where(
        categoryIds.length === 1
          ? eq(schema.categories.id, categoryIds[0])
          : inArray(schema.categories.id, categoryIds)
      );

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
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    const { categoryIds } = await request.json();

    if (!Array.isArray(categoryIds)) {
      return NextResponse.json(
        { error: 'categoryIds must be an array' },
        { status: 400 }
      );
    }

    // 使用事务创建文章分类关联
    await db.transaction(async (tx) => {
      // 1. 删除原有的文章-分类关联
      await tx
        .delete(schema.postCategories)
        .where(eq(schema.postCategories.postId, postId));

      // 2. 创建新的文章-分类关联
      if (categoryIds.length > 0) {
        const postCategoriesData = categoryIds.map(categoryId => ({
          postId,
          categoryId: Number(categoryId)
        }));

        await tx.insert(schema.postCategories).values(postCategoriesData);

        // 3. 更新文章的主分类（使用第一个分类作为主分类）
        await tx
          .update(schema.posts)
          .set({
            categoryId: Number(categoryIds[0]),
            updatedAt: new Date().toISOString()
          })
          .where(eq(schema.posts.id, postId));
      } else {
        // 如果没有分类，将主分类设为null
        await tx
          .update(schema.posts)
          .set({
            categoryId: null,
            updatedAt: new Date().toISOString()
          })
          .where(eq(schema.posts.id, postId));
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error creating post categories:', error);
    return NextResponse.json(
      { error: 'Failed to create post categories' },
      { status: 500 }
    );
  }
}

// PUT 更新文章的分类
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    const { categoryIds } = await request.json();

    if (!Array.isArray(categoryIds)) {
      return NextResponse.json(
        { error: 'categoryIds must be an array' },
        { status: 400 }
      );
    }

    // 使用事务更新文章分类
    await db.transaction(async (tx) => {
      // 1. 删除原有的文章-分类关联
      await tx
        .delete(schema.postCategories)
        .where(eq(schema.postCategories.postId, postId));

      // 2. 创建新的文章-分类关联
      if (categoryIds.length > 0) {
        const postCategoriesData = categoryIds.map(categoryId => ({
          postId,
          categoryId: Number(categoryId)
        }));

        await tx.insert(schema.postCategories).values(postCategoriesData);

        // 3. 更新文章的主分类（使用第一个分类作为主分类）
        await tx
          .update(schema.posts)
          .set({
            categoryId: Number(categoryIds[0]),
            updatedAt: new Date().toISOString()
          })
          .where(eq(schema.posts.id, postId));
      } else {
        // 如果没有分类，将主分类设为null
        await tx
          .update(schema.posts)
          .set({
            categoryId: null,
            updatedAt: new Date().toISOString()
          })
          .where(eq(schema.posts.id, postId));
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating post categories:', error);
    return NextResponse.json(
      { error: 'Failed to update post categories' },
      { status: 500 }
    );
  }
}
