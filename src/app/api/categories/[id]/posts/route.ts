import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/schema';
import { eq, desc, sql, and } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // 从路由参数获取分类ID
    const { id: idParam } = context.params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid category ID' },
        { status: 400 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const offset = (page - 1) * pageSize;

    // 获取分类
    const categoryResults = await db
      .select()
      .from(schema.categories)
      .where(eq(schema.categories.id, id))
      .limit(1);

    const category = categoryResults[0];

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // 获取分类下的文章总数
    const countResult = await db
      .select({ count: sql`count(*)` })
      .from(schema.postCategories)
      .innerJoin(schema.posts, eq(schema.postCategories.postId, schema.posts.id))
      .where(and(
        eq(schema.postCategories.categoryId, category.id),
        eq(schema.posts.published, 1)
      ));

    console.log('Count result:', countResult);

    // 确保 countResult 是有效的
    let totalPosts = 0;
    if (countResult && countResult.length > 0 && countResult[0].count !== undefined) {
      totalPosts = Number(countResult[0].count);
    }

    const totalPages = Math.ceil(totalPosts / pageSize);

    // 获取分类下的文章，带分页
    let postsResult: any[] = [];
    try {
      // 打印分类 ID
      console.log('Category ID:', category.id);

      // 获取分类关联的文章，并进行过滤
      postsResult = await db
        .select({
          id: schema.posts.id,
          title: schema.posts.title,
          slug: schema.posts.slug,
          excerpt: schema.posts.excerpt,
          coverImage: schema.posts.coverImage,
          createdAt: schema.posts.createdAt,
        })
        .from(schema.postCategories)
        .innerJoin(schema.posts, eq(schema.postCategories.postId, schema.posts.id))
        .where(and(
          eq(schema.postCategories.categoryId, category.id),
          eq(schema.posts.published, 1)
        ))
        .orderBy(desc(schema.posts.createdAt))
        .limit(pageSize)
        .offset(offset);

      console.log('Posts found:', postsResult.length);
      console.log('Posts data:', JSON.stringify(postsResult));

      // 文章查询完成
    } catch (error) {
      console.error('Error querying posts:', error);
      postsResult = [];
    }

    // 优化查询，一次性获取所有文章的标签
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
          tags: tagsMap.get(post.id) || []
        };
      });
    }

    // 构建响应数据
    const response = {
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        parentId: category.parentId,
        order: category.order,
        createdAt: category.createdAt
      },
      posts: posts || [],
      pagination: {
        page,
        pageSize,
        totalPosts,
        totalPages,
      },
    };

    console.log('Response:', JSON.stringify(response));

    // 直接返回简单的对象
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching category posts:', error);
    return NextResponse.json(
      {
        category: { id: 0, name: '', slug: '', description: null, parentId: null, order: 0, createdAt: '' },
        posts: [],
        pagination: { page: 1, pageSize: 10, totalPosts: 0, totalPages: 1 },
        error: 'Failed to fetch category posts'
      },
      { status: 500 }
    );
  }
}
