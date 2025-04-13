import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/schema';
import { eq, and, ne } from 'drizzle-orm';

// GET handler to fetch a single post by ID
export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    // 获取ID参数
    const id = parseInt(context.params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid post ID' },
        { status: 400 }
      );
    }

    const post = await db.query.posts.findFirst({
      where: eq(schema.posts.id, id)
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

// PATCH handler to update a post
export async function PATCH(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    // 获取ID参数
    const id = parseInt(context.params.id);

    if (isNaN(id)) {
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
          ne(posts.id, id)
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
          .where(eq(schema.posts.id, id));

        // 2. 删除原有的文章-分类关联
        await tx
          .delete(schema.postCategories)
          .where(eq(schema.postCategories.postId, id));

        // 3. 创建新的文章-分类关联
        if (Array.isArray(categoryIds) && categoryIds.length > 0) {
          const postCategoriesData = categoryIds.map(categoryId => ({
            postId: id,
            categoryId: Number(categoryId)
          }));

          await tx.insert(schema.postCategories).values(postCategoriesData);
        }
      });

      console.log('Post updated successfully:', id);
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

// PUT handler to update a post (identical to PATCH for compatibility)
export async function PUT(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    // 获取ID参数
    const id = parseInt(context.params.id);

    if (isNaN(id)) {
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
          ne(posts.id, id)
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
          .where(eq(schema.posts.id, id));

        // 2. 删除原有的文章-分类关联
        await tx
          .delete(schema.postCategories)
          .where(eq(schema.postCategories.postId, id));

        // 3. 创建新的文章-分类关联
        if (Array.isArray(categoryIds) && categoryIds.length > 0) {
          const postCategoriesData = categoryIds.map(categoryId => ({
            postId: id,
            categoryId: Number(categoryId)
          }));

          await tx.insert(schema.postCategories).values(postCategoriesData);
        }
      });

      console.log('Post updated successfully (PUT):', id);
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

// DELETE handler to delete a post
export async function DELETE(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    // 获取ID参数
    const id = parseInt(context.params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid post ID' },
        { status: 400 }
      );
    }

    await db
      .delete(schema.posts)
      .where(eq(schema.posts.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    );
  }
}
