import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/schema';
import { eq, and, ne } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    // 获取文章基本信息
    const post = await db.query.posts.findFirst({
      where: and(
        eq(schema.posts.slug, params.slug),
        eq(schema.posts.published, 1)
      ),
      with: {
        author: true
      }
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // 获取文章标签
    const postTags = await db
      .select({
        id: schema.tags.id,
        name: schema.tags.name,
        slug: schema.tags.slug
      })
      .from(schema.postTags)
      .where(eq(schema.postTags.postId, post.id))
      .innerJoin(schema.tags, eq(schema.postTags.tagId, schema.tags.id))
      .all();

    // 获取文章分类
    const category = post.categoryId 
      ? await db
          .select()
          .from(schema.categories)
          .where(eq(schema.categories.id, post.categoryId))
          .get()
      : null;

    // 获取相关文章（同分类的其他文章）
    const relatedPosts = post.categoryId
      ? await db
          .select({
            id: schema.posts.id,
            title: schema.posts.title,
            slug: schema.posts.slug,
            excerpt: schema.posts.excerpt,
            coverImage: schema.posts.coverImage,
            createdAt: schema.posts.createdAt
          })
          .from(schema.posts)
          .where(
            and(
              eq(schema.posts.categoryId, post.categoryId),
              eq(schema.posts.published, 1),
              ne(schema.posts.id, post.id) // 直接在查询中排除当前文章
            )
          )
          .limit(3)
          .all()
      : [];

    // 确保返回的数据类型安全
    const safePost = {
      ...post,
      title: String(post.title), // 确保标题是字符串
      tags: postTags,
      category,
      relatedPosts: relatedPosts.map(relatedPost => ({
        ...relatedPost,
        title: String(relatedPost.title) // 确保相关文章标题是字符串
      }))
    };

    return NextResponse.json(safePost);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to fetch post' },
      { status: 500 }
    );
  }
}
