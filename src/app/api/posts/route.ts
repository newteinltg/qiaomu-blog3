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
    const categoryId = searchParams.get('categoryId');
    const tagId = searchParams.get('tagId');
    const sortBy = searchParams.get('sortBy') || 'createdAt'; // 默认按创建时间排序
    const sortOrder = searchParams.get('sortOrder') || 'desc'; // 默认降序
    const pinned = searchParams.get('pinned'); // 是否只显示置顶文章

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
          data: [],
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
      .select()
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

    // 置顶文章始终排在最前面
    orderClauses.push(desc(schema.posts.pinned));

    // 添加用户指定的排序
    if (sortBy === 'title') {
      orderClauses.push(sortOrder === 'asc' ? asc(schema.posts.title) : desc(schema.posts.title));
    } else if (sortBy === 'updatedAt') {
      orderClauses.push(sortOrder === 'asc' ? asc(schema.posts.updatedAt) : desc(schema.posts.updatedAt));
    } else if (sortBy === 'categoryName') {
      orderClauses.push(sortOrder === 'asc' ? asc(schema.categories.name) : desc(schema.categories.name));
    } else {
      // 默认按创建时间排序
      orderClauses.push(sortOrder === 'asc' ? asc(schema.posts.createdAt) : desc(schema.posts.createdAt));
    }

    // 应用排序和分页
    const finalQuery = joinedQuery
      .orderBy(...orderClauses)
      .limit(pageSize)
      .offset(offset);

    // 执行查询
    const postsData = await finalQuery.execute();

    // 格式化结果
    const formattedPosts = postsData.map(row => ({
      id: row.posts.id,
      title: String(row.posts.title),
      slug: row.posts.slug,
      content: row.posts.content,
      excerpt: row.posts.excerpt,
      coverImage: row.posts.coverImage,
      published: Boolean(row.posts.published),
      pinned: Boolean(row.posts.pinned),
      createdAt: row.posts.createdAt,
      updatedAt: row.posts.updatedAt,
      authorId: row.posts.authorId,
      categoryId: row.posts.categoryId,
      categoryName: row.categories?.name,
      categories: [] // 将在后面填充所有分类
    }));

    // 获取每篇文章的标签和分类
    const postsWithTagsAndCategories = await Promise.all(formattedPosts.map(async (post) => {
      // 1. 获取文章的标签关联
      const postTagsRelations = await db
        .select()
        .from(schema.postTags)
        .where(eq(schema.postTags.postId, post.id))
        .execute();

      let tags: Array<{ id: number; name: string; slug: string }> = [];

      if (postTagsRelations.length > 0) {
        const tagIds = postTagsRelations.map(relation => relation.tagId);

        // 获取标签详情
        const tagsData = await db
          .select()
          .from(schema.tags)
          .where(inArray(schema.tags.id, tagIds))
          .execute();

        tags = tagsData.map(tag => ({
          id: tag.id,
          name: tag.name,
          slug: tag.slug
        }));
      }

      // 2. 获取文章的所有分类
      const postCategoriesRelations = await db
        .select()
        .from(schema.postCategories)
        .where(eq(schema.postCategories.postId, post.id))
        .execute();

      let categories: Array<{ id: number; name: string; slug: string }> = [];

      if (postCategoriesRelations.length > 0) {
        const categoryIds = postCategoriesRelations.map(relation => relation.categoryId);

        // 获取分类详情
        const categoriesData = await db
          .select()
          .from(schema.categories)
          .where(inArray(schema.categories.id, categoryIds))
          .execute();

        categories = categoriesData.map(category => ({
          id: category.id,
          name: category.name,
          slug: category.slug
        }));
      } else if (post.categoryId) {
        // 如果没有在关联表中找到分类，但文章有主分类，则使用主分类
        const mainCategory = await db
          .select()
          .from(schema.categories)
          .where(eq(schema.categories.id, post.categoryId))
          .limit(1)
          .execute();

        if (mainCategory.length > 0) {
          categories = [{
            id: mainCategory[0].id,
            name: mainCategory[0].name,
            slug: mainCategory[0].slug
          }];
        }
      }

      return {
        ...post,
        tags,
        categories
      };
    }));

    // 计算总页数
    const totalPages = Math.ceil(totalCount / pageSize);

    return NextResponse.json({
      data: postsWithTagsAndCategories,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages
      }
    });
  } catch (error) {
    console.error('获取文章时出错:', error);
    return NextResponse.json(
      { error: '获取文章失败' },
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
