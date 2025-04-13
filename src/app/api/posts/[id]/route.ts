import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/schema';
import { eq, and, ne } from 'drizzle-orm';

// GET 处理程序 - 获取单个文章
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 获取文章ID
    const { id } = await params;
    const numId = parseInt(id);

    if (isNaN(numId)) {
      return NextResponse.json(
        { error: 'Invalid post ID' },
        { status: 400 }
      );
    }

    const post = await db.query.posts.findFirst({
      where: eq(schema.posts.id, numId)
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json(
      { error: 'Failed to fetch post' },
      { status: 500 }
    );
  }
}

// PATCH 处理程序 - 更新文章
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 获取文章ID
    const { id } = await params;
    const numId = parseInt(id);

    if (isNaN(numId)) {
      return NextResponse.json(
        { error: 'Invalid post ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { title, slug, content, categoryIds, coverImage, published, pageType } = body;

    console.log('Updating post with data:', {
      id,
      title,
      slug,
      categoryIds: categoryIds || [],
      coverImage: coverImage || null,
      contentLength: content?.length || 0,
      published
    });

    if (!title || !slug || !content) {
      return NextResponse.json(
        { error: '标题、URL别名和内容不能为空' },
        { status: 400 }
      );
    }

    // 检查slug是否已存在（排除当前文章）
    const existingPost = await db.query.posts.findFirst({
      where: (posts) =>
        and(
          eq(posts.slug, slug),
          ne(posts.id, numId)
        )
    });

    if (existingPost) {
      return NextResponse.json(
        { error: 'URL别名已被使用，请选择其他别名' },
        { status: 400 }
      );
    }

    try {
      // 使用事务来更新文章和分类关联
      await db.transaction(async (tx) => {
        // 1. 更新文章基本信息
        await tx
          .update(schema.posts)
          .set({
            title,
            slug,
            content,
            categoryId: Array.isArray(categoryIds) && categoryIds.length > 0 ? categoryIds[0] : null, // 保留主分类
            coverImage: coverImage || null,
            published: published ? 1 : 0,
            pageType: pageType || 'markdown', // 添加页面类型字段
            updatedAt: new Date().toISOString()
          })
          .where(eq(schema.posts.id, numId));

        // 2. 删除原有的文章-分类关联
        await tx
          .delete(schema.postCategories)
          .where(eq(schema.postCategories.postId, numId));

        // 3. 创建新的文章-分类关联
        if (Array.isArray(categoryIds) && categoryIds.length > 0) {
          const postCategoriesData = categoryIds.map(categoryId => ({
            postId: numId,
            categoryId: Number(categoryId)
          }));

          await tx.insert(schema.postCategories).values(postCategoriesData);
        }
      });

      console.log('Post updated successfully:', numId);
      return NextResponse.json({ success: true });
    } catch (dbError: any) {
      console.error('Database error updating post:', dbError);
      return NextResponse.json(
        { error: `数据库错误: ${dbError.message || '未知错误'}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error updating post:', error);
    return NextResponse.json(
      { error: `更新文章失败: ${error.message || '未知错误'}` },
      { status: 500 }
    );
  }
}

// PUT 处理程序 - 替换文章
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 获取文章ID
    const { id } = await params;
    const numId = parseInt(id);

    if (isNaN(numId)) {
      return NextResponse.json(
        { error: 'Invalid post ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { title, slug, content, categoryIds, coverImage, published, pageType } = body;

    console.log('Updating post with data (PUT):', {
      id,
      title,
      slug,
      categoryIds: categoryIds || [],
      coverImage: coverImage || null,
      contentLength: content?.length || 0,
      published,
      pageType
    });

    if (!title || !slug || !content) {
      return NextResponse.json(
        { error: '标题、URL别名和内容不能为空' },
        { status: 400 }
      );
    }

    // 检查slug是否已存在（排除当前文章）
    const existingPost = await db.query.posts.findFirst({
      where: (posts) =>
        and(
          eq(posts.slug, slug),
          ne(posts.id, numId)
        )
    });

    if (existingPost) {
      return NextResponse.json(
        { error: 'URL别名已被使用，请选择其他别名' },
        { status: 400 }
      );
    }

    try {
      // 使用事务来更新文章和分类关联
      await db.transaction(async (tx) => {
        // 1. 更新文章基本信息
        await tx
          .update(schema.posts)
          .set({
            title,
            slug,
            content,
            categoryId: Array.isArray(categoryIds) && categoryIds.length > 0 ? categoryIds[0] : null, // 保留主分类
            coverImage: coverImage || null,
            published: published ? 1 : 0,
            pageType: pageType || 'markdown', // 添加页面类型字段
            updatedAt: new Date().toISOString()
          })
          .where(eq(schema.posts.id, numId));

        // 2. 删除原有的文章-分类关联
        await tx
          .delete(schema.postCategories)
          .where(eq(schema.postCategories.postId, numId));

        // 3. 创建新的文章-分类关联
        if (Array.isArray(categoryIds) && categoryIds.length > 0) {
          const postCategoriesData = categoryIds.map(categoryId => ({
            postId: numId,
            categoryId: Number(categoryId)
          }));

          await tx.insert(schema.postCategories).values(postCategoriesData);
        }
      });

      console.log('Post updated successfully (PUT):', numId);
      return NextResponse.json({ success: true });
    } catch (dbError: any) {
      console.error('Database error updating post:', dbError);
      return NextResponse.json(
        { error: `数据库错误: ${dbError.message || '未知错误'}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error updating post (PUT):', error);
    return NextResponse.json(
      { error: `更新文章失败: ${error.message || '未知错误'}` },
      { status: 500 }
    );
  }
}

// DELETE 处理程序 - 删除文章
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 获取文章ID
    const { id } = await params;
    const numId = parseInt(id);

    if (isNaN(numId)) {
      return NextResponse.json(
        { error: 'Invalid post ID' },
        { status: 400 }
      );
    }

    await db
      .delete(schema.posts)
      .where(eq(schema.posts.id, numId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    );
  }
}
