import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/schema';
import { eq, like, and, or, desc, sql, count } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const categoryId = searchParams.get('category');
    const tagId = searchParams.get('tag');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    const offset = (page - 1) * pageSize;

    console.log('搜索参数:', { query, categoryId, tagId, page, pageSize });

    if (!query && !categoryId && !tagId) {
      return NextResponse.json(
        { 
          error: '请提供搜索关键词或筛选条件',
          posts: [],
          pagination: {
            page,
            pageSize,
            totalPosts: 0,
            totalPages: 0
          }
        },
        { status: 400 }
      );
    }

    // 构建查询条件
    let whereConditions = and(
      eq(schema.posts.published, 1) // 只搜索已发布的文章
    );

    // 添加搜索关键词条件
    if (query) {
      whereConditions = and(
        whereConditions,
        or(
          like(schema.posts.title, `%${query}%`),
          like(schema.posts.content, `%${query}%`),
          like(schema.posts.excerpt, `%${query}%`)
        )
      );
    }

    // 获取符合条件的文章总数
    const totalCountResult = await db
      .select({ count: count() })
      .from(schema.posts)
      .where(whereConditions)
      .execute();

    const totalPosts = totalCountResult[0]?.count || 0;
    const totalPages = Math.ceil(totalPosts / pageSize);

    // 获取文章列表
    let postsQuery = db
      .select({
        id: schema.posts.id,
        title: schema.posts.title,
        slug: schema.posts.slug,
        excerpt: schema.posts.excerpt,
        coverImage: schema.posts.coverImage,
        createdAt: schema.posts.createdAt,
        updatedAt: schema.posts.updatedAt,
      })
      .from(schema.posts)
      .where(whereConditions)
      .orderBy(desc(schema.posts.createdAt))
      .limit(pageSize)
      .offset(offset);

    let posts = await postsQuery.all();

    // 如果指定了分类ID，过滤出该分类下的文章
    if (categoryId) {
      const categoryPosts = await db
        .select({ postId: schema.postCategories.postId })
        .from(schema.postCategories)
        .where(eq(schema.postCategories.categoryId, parseInt(categoryId, 10)))
        .all();

      const categoryPostIds = categoryPosts.map(p => p.postId);
      posts = posts.filter(post => categoryPostIds.includes(post.id));
    }

    // 如果指定了标签ID，过滤出该标签下的文章
    if (tagId) {
      const tagPosts = await db
        .select({ postId: schema.postTags.postId })
        .from(schema.postTags)
        .where(eq(schema.postTags.tagId, parseInt(tagId, 10)))
        .all();

      const tagPostIds = tagPosts.map(p => p.postId);
      posts = posts.filter(post => tagPostIds.includes(post.id));
    }

    // 获取每篇文章的标签
    const postsWithTags = await Promise.all(
      posts.map(async (post) => {
        const tags = await db
          .select({
            id: schema.tags.id,
            name: schema.tags.name,
            slug: schema.tags.slug,
          })
          .from(schema.tags)
          .innerJoin(schema.postTags, eq(schema.tags.id, schema.postTags.tagId))
          .where(eq(schema.postTags.postId, post.id))
          .all();

        return {
          ...post,
          tags,
        };
      })
    );

    // 获取所有分类和标签，用于搜索过滤器
    const categories = await db
      .select({
        id: schema.categories.id,
        name: schema.categories.name,
        slug: schema.categories.slug,
      })
      .from(schema.categories)
      .orderBy(schema.categories.name)
      .all();

    const tags = await db
      .select({
        id: schema.tags.id,
        name: schema.tags.name,
        slug: schema.tags.slug,
      })
      .from(schema.tags)
      .orderBy(schema.tags.name)
      .all();

    return NextResponse.json({
      query,
      posts: postsWithTags,
      filters: {
        categories,
        tags,
      },
      pagination: {
        page,
        pageSize,
        totalPosts,
        totalPages,
      },
    });
  } catch (error) {
    console.error('搜索失败:', error);
    return NextResponse.json(
      { error: '搜索失败', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
