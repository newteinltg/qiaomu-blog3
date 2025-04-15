import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/schema';
import { eq, like, and, or, desc, sql, count, inArray } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const categoryId = searchParams.get('category');
    const tagId = searchParams.get('tag');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
    const offset = (page - 1) * pageSize;

    console.log('所有文章列表参数:', { query, categoryId, tagId, page, pageSize });

    // 构建查询条件
    let whereConditions = and(
      eq(schema.posts.published, 1) // 只获取已发布的文章
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

    // 如果有标签筛选，先获取包含该标签的文章ID
    let postIdsWithTag: number[] = [];
    if (tagId) {
      const postsWithTag = await db
        .select({ postId: schema.postTags.postId })
        .from(schema.postTags)
        .where(eq(schema.postTags.tagId, parseInt(tagId)))
        .execute();

      postIdsWithTag = postsWithTag.map(item => item.postId);

      if (postIdsWithTag.length > 0) {
        whereConditions = and(
          whereConditions,
          inArray(schema.posts.id, postIdsWithTag)
        );
      } else {
        // 如果没有找到匹配的文章，返回空结果
        return NextResponse.json({
          posts: [],
          filters: {
            categories: await getCategories(),
            tags: await getTags()
          },
          pagination: {
            page,
            pageSize,
            totalPosts: 0,
            totalPages: 0
          }
        });
      }
    }

    // 如果有分类筛选，添加分类条件
    if (categoryId) {
      // 获取该分类下的所有文章ID
      const categoryPosts = await db
        .select({ postId: schema.postCategories.postId })
        .from(schema.postCategories)
        .where(eq(schema.postCategories.categoryId, parseInt(categoryId)))
        .all();

      if (categoryPosts.length > 0) {
        const categoryPostIds = categoryPosts.map(p => p.postId);
        whereConditions = and(
          whereConditions,
          inArray(schema.posts.id, categoryPostIds)
        );
      } else {
        // 如果没有找到匹配的文章，返回空结果
        return NextResponse.json({
          posts: [],
          filters: {
            categories: await getCategories(),
            tags: await getTags()
          },
          pagination: {
            page,
            pageSize,
            totalPosts: 0,
            totalPages: 0
          }
        });
      }
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
    const posts = await db
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
      .offset(offset)
      .all();

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

    // 获取所有分类和标签，用于过滤器
    const categories = await getCategories();
    const tags = await getTags();

    return NextResponse.json({
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
    console.error('获取所有文章列表失败:', error);
    return NextResponse.json(
      { error: '获取文章列表失败', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// 获取所有分类
async function getCategories() {
  return await db
    .select({
      id: schema.categories.id,
      name: schema.categories.name,
      slug: schema.categories.slug,
    })
    .from(schema.categories)
    .orderBy(schema.categories.name)
    .all();
}

// 获取所有标签
async function getTags() {
  return await db
    .select({
      id: schema.tags.id,
      name: schema.tags.name,
      slug: schema.tags.slug,
    })
    .from(schema.tags)
    .orderBy(schema.tags.name)
    .all();
}
