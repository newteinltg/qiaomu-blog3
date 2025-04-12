import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/schema';
import { eq, desc, sql } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // 从 URL 路径中提取标签名
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const slug = pathParts[pathParts.length - 2]; // 假设路径是 /api/tags/[slug]/posts

    const { searchParams } = url;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const offset = (page - 1) * pageSize;

    // 获取标签
    const tagResults = await db
      .select()
      .from(schema.tags)
      .where(eq(schema.tags.slug, slug))
      .limit(1);

    const tag = tagResults[0];

    if (!tag) {
      return NextResponse.json(
        { error: 'Tag not found' },
        { status: 404 }
      );
    }

    // 获取标签下的文章总数
    const countResult = await db
      .select({ count: sql`count(*)` })
      .from(schema.postTags)
      .innerJoin(schema.posts, eq(schema.postTags.postId, schema.posts.id))
      .where(eq(schema.postTags.tagId, tag.id));

    // 确保 countResult 是有效的
    let totalPosts = 0;
    if (countResult && countResult.length > 0 && countResult[0].count !== undefined) {
      totalPosts = Number(countResult[0].count);
    }

    const totalPages = Math.ceil(totalPosts / pageSize);

    // 获取标签下的文章，带分页
    let postsResult: any[] = [];
    try {
      // 打印标签 ID
      // 获取标签关联的文章，并进行过滤
      postsResult = await db
        .select({
          id: schema.posts.id,
          title: schema.posts.title,
          slug: schema.posts.slug,
          excerpt: schema.posts.excerpt,
          coverImage: schema.posts.coverImage,
          createdAt: schema.posts.createdAt,
          categoryId: schema.posts.categoryId,
        })
        .from(schema.posts)
        .innerJoin(schema.postTags, eq(schema.posts.id, schema.postTags.postId))
        .where(eq(schema.postTags.tagId, tag.id))
        .orderBy(desc(schema.posts.createdAt))
        .limit(pageSize)
        .offset(offset);

      // 文章查询完成
    } catch (error) {
      console.error('Error querying posts:', error);
      postsResult = [];
    }

    // 优化查询，一次性获取所有文章的标签和分类
    let posts: any[] = [];
    if (postsResult && Array.isArray(postsResult) && postsResult.length > 0) {
      // 提取所有文章ID
      const postIds = postsResult.map(post => post.id);

      // 一次性获取所有文章的标签
      const allPostTags = await db
        .select({
          postId: schema.postTags.postId,
          tagId: schema.tags.id,
          tagName: schema.tags.name,
          tagSlug: schema.tags.slug,
        })
        .from(schema.postTags)
        .where(sql`${schema.postTags.postId} IN (${postIds.join(',')})`)
        .leftJoin(schema.tags, eq(schema.postTags.tagId, schema.tags.id));

      // 按文章ID组织标签
      const tagsMap = new Map();
      allPostTags.forEach(item => {
        if (!tagsMap.has(item.postId)) {
          tagsMap.set(item.postId, []);
        }
        tagsMap.get(item.postId).push({
          id: item.tagId,
          name: item.tagName,
          slug: item.tagSlug
        });
      });

      // 一次性获取所有分类信息
      const categoryIds = postsResult.filter(post => post.categoryId).map(post => post.categoryId);
      const categories = categoryIds.length > 0 ? await db
        .select({
          id: schema.categories.id,
          name: schema.categories.name
        })
        .from(schema.categories)
        .where(sql`${schema.categories.id} IN (${categoryIds.join(',')})`) : [];

      // 按分类ID组织分类
      const categoryMap = new Map();
      categories.forEach(category => {
        categoryMap.set(category.id, category.name);
      });

      // 构建最终的文章数组
      posts = postsResult.map(post => {
        return {
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          coverImage: post.coverImage,
          createdAt: post.createdAt,
          author: null,
          categoryName: post.categoryId ? categoryMap.get(post.categoryId) || null : null,
          tags: tagsMap.get(post.id) || []
        };
      });
    }

    // 构建响应数据

    // 确保返回的数据是有效的
    const response = {
      tag: {
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        description: tag.description,
        createdAt: tag.createdAt
      },
      posts: posts || [],
      pagination: {
        page,
        pageSize,
        totalPosts,
        totalPages,
      },
    };

    // 返回响应

    // 直接返回简单的对象
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching tag posts:', error);
    return NextResponse.json(
      {
        tag: { id: 0, name: '', slug: '', description: null, createdAt: '' },
        posts: [],
        pagination: { page: 1, pageSize: 10, totalPosts: 0, totalPages: 1 },
        error: 'Failed to fetch tag posts'
      },
      { status: 500 }
    );
  }
}
