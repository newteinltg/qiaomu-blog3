import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/schema';
import { eq, inArray } from 'drizzle-orm';

// GET 获取文章的所有分类
export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;
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
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;
    const postId = parseInt(id);
    const { categoryIds } = await request.json();

    if (isNaN(postId)) {
      return NextResponse.json(
        { error: 'Invalid post ID' },
        { status: 400 }
      );
    }

    if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
      return NextResponse.json(
        { error: 'Category IDs are required' },
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

    // 检查分类是否存在
    const categories = await db.query.categories.findMany({
      where: inArray(schema.categories.id, categoryIds)
    });

    if (categories.length !== categoryIds.length) {
      return NextResponse.json(
        { error: 'One or more categories not found' },
        { status: 404 }
      );
    }

    // 创建文章与分类的关联
    const postCategoryValues = categoryIds.map(categoryId => ({
      postId,
      categoryId
    }));

    await db.insert(schema.postCategories).values(postCategoryValues);

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
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;
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
