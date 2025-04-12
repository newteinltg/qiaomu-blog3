import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/schema';
import { eq, or, sql } from 'drizzle-orm';
import { generateSlug } from '@/lib/utils';

// GET 获取文章的所有标签
export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const { id } = await context.params;

    // 检查文章是否存在
    const post = await db.query.posts.findFirst({
      where: eq(schema.posts.id, parseInt(id))
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // 获取文章的所有标签
    const postTagsRelations = await db
      .select()
      .from(schema.postTags)
      .where(eq(schema.postTags.postId, parseInt(id)));

    if (!postTagsRelations.length) {
      return NextResponse.json([]);
    }

    const tagIds = postTagsRelations.map(relation => relation.tagId);

    // 获取标签详情 - 使用 SQL 表达式代替 inArray
    const tags = await db
      .select()
      .from(schema.tags)
      .where(
        tagIds.length > 0
          ? sql`${schema.tags.id} IN (${tagIds.join(',')})`
          : sql`FALSE`
      );

    return NextResponse.json(tags);
  } catch (error) {
    console.error('Error fetching post tags:', error);
    return NextResponse.json(
      { error: 'Failed to fetch post tags' },
      { status: 500 }
    );
  }
}

// 处理标签数据的通用函数
async function handleTagsUpdate(request: Request, context: { params: { id: string } }) {
  try {
    const { id } = await context.params;

    const requestData = await request.json();
    // 支持两种格式：{ tags: [...] } 或直接传递标签数组
    const tags = requestData.tags || requestData;
    const postId = parseInt(id);

    // 检查文章是否存在
    const post = await db.query.posts.findFirst({
      where: eq(schema.posts.id, postId)
    });

    if (!post) {
      return NextResponse.json(
        { error: '文章不存在' },
        { status: 404 }
      );
    }

    // 删除所有现有的标签关联
    await db
      .delete(schema.postTags)
      .where(eq(schema.postTags.postId, postId));

    // 如果没有新标签，直接返回成功
    if (!tags || !Array.isArray(tags) || tags.length === 0) {
      return NextResponse.json({ success: true });
    }

    // 处理标签数据
    const tagData = [];

    for (const tag of tags) {
      // 支持多种标签格式
      // 1. Tagify 格式: { value: "标签名", id?: number }
      // 2. 自定义格式: { name: "标签名", id?: number, isNew?: boolean }
      // 3. 简单字符串: "标签名"

      const tagValue = typeof tag === 'string'
        ? tag
        : tag.value || tag.name || '';

      const tagId = tag.id ? Number(tag.id) : null;
      const isNewTag = tag.isNew || !tagId;

      if (!tagValue) {
        continue;
      }

      // 如果是新标签，先创建
      if (isNewTag) {
        // 检查标签是否已存在
        const existingTag = await db.query.tags.findFirst({
          where: eq(schema.tags.name, tagValue)
        });

        if (existingTag) {
          // 使用已存在的标签
          tagData.push({
            postId,
            tagId: existingTag.id
          });
        } else {
          // 创建新标签
          const slug = generateSlug(tagValue);

          // 使用与数据库模式匹配的字段名
          const result = await db.insert(schema.tags).values({
            name: tagValue,
            slug,
            createdAt: new Date().toISOString()
          });

          const newTagId = Number(result.lastInsertRowid);

          tagData.push({
            postId,
            tagId: newTagId
          });
        }
      } else {
        // 使用现有标签
        tagData.push({
          postId,
          tagId
        });
      }
    }

    // 添加新的标签关联
    if (tagData.length) {
      await db.insert(schema.postTags).values(tagData);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('更新文章标签时出错:', error);
    return NextResponse.json(
      { error: '更新文章标签失败' },
      { status: 500 }
    );
  }
}

// POST 更新文章的标签
export async function POST(
  request: Request,
  context: { params: { id: string } }
) {
  return handleTagsUpdate(request, context);
}

// PUT 更新文章的标签 (与 POST 功能相同，为了兼容性)
export async function PUT(
  request: Request,
  context: { params: { id: string } }
) {
  return handleTagsUpdate(request, context);
}
