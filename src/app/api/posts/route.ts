import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/schema';
import { eq, like, sql, and, inArray, asc, desc } from 'drizzle-orm';

// GET handler to fetch all posts
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '25');
    const limit = parseInt(searchParams.get('limit') || pageSize.toString());
    const categoryId = searchParams.get('categoryId');
    const tagId = searchParams.get('tagId');
    const sortBy = searchParams.get('sortBy') || 'createdAt'; // 默认按创建时间排序
    const sortOrder = searchParams.get('sortOrder') || 'desc'; // 默认降序
    const pinned = searchParams.get('pinned'); // 是否只显示置顶文章
    const isAdmin = searchParams.get('admin') === '1'; // 是否是管理后台请求

    // 计算偏移量
    const offset = (page - 1) * pageSize;

    // 如果有标签筛选，先获取包含该标签的文章ID
    let postIdsWithTag: number[] = [];
    if (tagId) {
      const postsWithTag = await db
        .select({ postId: schema.postTags.postId })
        .from(schema.postTags)
        .where(eq(schema.postTags.tagId, parseInt(tagId)))
        .execute();

      postIdsWithTag = postsWithTag.map(item => item.postId);

      if (postIdsWithTag.length === 0) {
        // 如果没有找到匹配的文章，返回空结果
        return NextResponse.json({
          posts: [],
          data: [], // 兼容旧版API
          pagination: {
            page,
            pageSize,
            totalCount: 0,
            totalPages: 0
          }
        });
      }
    }

    // 构建 where 条件
    const conditions = [];

    // 非管理后台请求，默认只显示已发布的文章
    if (!isAdmin) {
      conditions.push(eq(schema.posts.published, 1));
    }

    if (search) {
      conditions.push(like(schema.posts.title, `%${search}%`));
    }

    if (categoryId) {
      conditions.push(eq(schema.posts.categoryId, parseInt(categoryId)));
    }

    if (tagId && postIdsWithTag.length > 0) {
      conditions.push(inArray(schema.posts.id, postIdsWithTag));
    }

    if (pinned === '1') {
      conditions.push(eq(schema.posts.pinned, 1));
    }

    // 获取总记录数
    let totalCount = 0;
    if (conditions.length > 0) {
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.posts)
        .where(conditions.length === 1 ? conditions[0] : and(...conditions))
        .execute();
      totalCount = countResult[0].count;
    } else {
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.posts)
        .execute();
      totalCount = countResult[0].count;
    }

    // 构建基本查询
    const baseQuery = db
      .select({
        id: schema.posts.id,
        title: schema.posts.title,
        slug: schema.posts.slug,
        excerpt: schema.posts.excerpt,
        coverImage: schema.posts.coverImage,
        createdAt: schema.posts.createdAt,
        updatedAt: schema.posts.updatedAt,
        published: schema.posts.published,
        pinned: schema.posts.pinned,
        authorId: schema.posts.authorId,
        categoryId: schema.posts.categoryId,
        category: {
          id: schema.categories.id,
          name: schema.categories.name,
          slug: schema.categories.slug,
        },
      })
      .from(schema.posts);
      
    // 应用 where 条件
    let query;
    if (conditions.length > 0) {
      query = baseQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions));
    } else {
      query = baseQuery;
    }
    
    // 添加连接
    const joinedQuery = query.leftJoin(schema.categories, eq(schema.posts.categoryId, schema.categories.id));

    // 应用排序
    const orderClauses = [];

    if (sortBy === 'title') {
      orderClauses.push(sortOrder === 'asc' ? asc(schema.posts.title) : desc(schema.posts.title));
    } else if (sortBy === 'createdAt') {
      orderClauses.push(sortOrder === 'asc' ? asc(schema.posts.createdAt) : desc(schema.posts.createdAt));
    } else if (sortBy === 'updatedAt') {
      orderClauses.push(sortOrder === 'asc' ? asc(schema.posts.updatedAt) : desc(schema.posts.updatedAt));
    } else if (sortBy === 'pinned') {
      orderClauses.push(sortOrder === 'asc' ? asc(schema.posts.pinned) : desc(schema.posts.pinned));
      // 如果按置顶排序，添加第二排序条件为创建时间
      orderClauses.push(desc(schema.posts.createdAt));
    }

    // 如果没有指定排序，默认按创建时间降序
    if (orderClauses.length === 0) {
      orderClauses.push(desc(schema.posts.createdAt));
    }

    const orderedQuery = joinedQuery.orderBy(...orderClauses);

    // 应用分页
    const paginatedQuery = orderedQuery.limit(limit).offset(offset);

    // 执行查询
    const posts = await paginatedQuery.execute();

    // 获取每篇文章的标签
    const postsWithTags = await Promise.all(posts.map(async (post) => {
      const tags = await db
        .select({
          id: schema.tags.id,
          name: schema.tags.name,
          slug: schema.tags.slug,
        })
        .from(schema.postTags)
        .leftJoin(schema.tags, eq(schema.postTags.tagId, schema.tags.id))
        .where(eq(schema.postTags.postId, post.id))
        .execute();

      return {
        ...post,
        tags,
      };
    }));

    // 计算总页数
    const totalPages = Math.ceil(totalCount / pageSize);

    return NextResponse.json({
      posts: postsWithTags, // 新版API使用 posts
      data: postsWithTags,  // 旧版API使用 data
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

// POST handler to create a new post
export async function POST(request: Request) {
  try {
    const { title, slug, content, categoryIds, coverImage, published = false, pageType = 'markdown' } = await request.json();

    if (!title || !slug || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existingPost = await db.query.posts.findFirst({
      where: eq(schema.posts.slug, slug)
    });

    if (existingPost) {
      return NextResponse.json(
        { error: 'Slug already exists' },
        { status: 400 }
      );
    }

    // 开始事务
    const result = await db.transaction(async (tx) => {
      // 1. 创建文章
      const postResult = await tx.insert(schema.posts).values({
        title,
        slug,
        content,
        categoryId: Array.isArray(categoryIds) && categoryIds.length > 0 ? categoryIds[0] : null, // 保留主分类在posts表中
        coverImage: coverImage || null,
        published: published ? 1 : 0,
        pageType, // 添加页面类型字段
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      const postId = Number(postResult.lastInsertRowid);

      // 2. 如果有分类，创建文章-分类关联
      if (Array.isArray(categoryIds) && categoryIds.length > 0) {
        const postCategoriesData = categoryIds.map(categoryId => ({
          postId,
          categoryId: Number(categoryId)
        }));

        await tx.insert(schema.postCategories).values(postCategoriesData);
      }

      return postId;
    });

    return NextResponse.json({
      success: true,
      id: result
    });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  }
}

// PATCH handler to update post status (publish/unpublish)
export async function PATCH(request: Request) {
  try {
    const { id, published, pinned } = await request.json();

    if (id === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 构建更新对象
    const updateData: any = {};

    // 只更新提供的字段
    if (published !== undefined) {
      updateData.published = published ? 1 : 0;
    }

    if (pinned !== undefined) {
      updateData.pinned = pinned ? 1 : 0;
    }

    // 执行更新
    await db
      .update(schema.posts)
      .set(updateData)
      .where(eq(schema.posts.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json(
      { error: 'Failed to update post' },
      { status: 500 }
    );
  }
}
