import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/schema';
import { eq, lt, gt, asc, desc, and } from 'drizzle-orm';

/**
 * 获取文章的上一篇和下一篇文章
 * @param request 请求对象，包含当前文章ID
 * @returns 上一篇和下一篇文章信息
 */
export async function GET(request: NextRequest) {
  try {
    // 从URL参数中获取当前文章ID
    const searchParams = request.nextUrl.searchParams;
    const currentPostId = searchParams.get('postId');

    console.log('收到请求，文章ID:', currentPostId);

    if (!currentPostId) {
      console.log('缺少postId参数');
      return NextResponse.json(
        { error: 'Missing postId parameter' },
        { status: 400 }
      );
    }

    // 将ID转换为数字
    const postId = Number(currentPostId);
    console.log('转换后的文章ID:', postId, '类型:', typeof postId);

    // 定义文章类型
    type PostNavigation = {
      id: number;
      title: string;
      slug: string;
    };

    // 获取上一篇文章（ID小于当前文章的最大一篇）
    const prevPosts = await db
      .select({
        id: schema.posts.id,
        title: schema.posts.title,
        slug: schema.posts.slug,
      })
      .from(schema.posts)
      .where(and(
        lt(schema.posts.id, postId),
        eq(schema.posts.published, 1) // 只获取已发布的文章
      ))
      .orderBy(desc(schema.posts.id))
      .limit(1);

    // 获取下一篇文章（ID大于当前文章的最小一篇）
    const nextPosts = await db
      .select({
        id: schema.posts.id,
        title: schema.posts.title,
        slug: schema.posts.slug,
      })
      .from(schema.posts)
      .where(and(
        gt(schema.posts.id, postId),
        eq(schema.posts.published, 1) // 只获取已发布的文章
      ))
      .orderBy(asc(schema.posts.id))
      .limit(1);

    // 获取所有已发布的文章，用于确定当前文章的位置
    const allPublishedPosts = await db
      .select({
        id: schema.posts.id,
        title: schema.posts.title,
        slug: schema.posts.slug,
      })
      .from(schema.posts)
      .where(eq(schema.posts.published, 1))
      .orderBy(desc(schema.posts.id));

    console.log('已发布文章列表:', allPublishedPosts.map((p: PostNavigation) => ({ id: p.id, title: p.title })));

    // 找到当前文章在已发布文章列表中的位置
    const currentIndex = allPublishedPosts.findIndex((post: PostNavigation) => Number(post.id) === postId);
    console.log('当前文章在列表中的索引:', currentIndex);

    let prevPost: PostNavigation | null = null;
    let nextPost: PostNavigation | null = null;

    if (currentIndex !== -1) {
      // 如果找到了当前文章
      if (currentIndex < allPublishedPosts.length - 1) {
        // 如果不是最后一篇文章，则有上一篇（较新的文章）
        prevPost = allPublishedPosts[currentIndex + 1];
      }

      if (currentIndex > 0) {
        // 如果不是第一篇文章，则有下一篇（较旧的文章）
        nextPost = allPublishedPosts[currentIndex - 1];
      }
    }

    // 如果通过ID查询找到了文章，优先使用这些结果
    if (prevPosts.length > 0) {
      prevPost = prevPosts[0];
    }

    if (nextPosts.length > 0) {
      nextPost = nextPosts[0];
    }

    return NextResponse.json({
      prev: prevPost,
      next: nextPost
    });
  } catch (error) {
    console.error('获取导航信息失败:', error);
    return NextResponse.json(
      { error: 'Failed to get navigation information' },
      { status: 500 }
    );
  }
}
