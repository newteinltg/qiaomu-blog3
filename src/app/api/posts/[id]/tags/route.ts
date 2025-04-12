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
    const { id } = context.params;

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

    // 获取标签详情
    const tagIds = postTagsRelations.map(relation => relation.tagId);
    const tags = await db
      .select()
      .from(schema.tags)
      .where(
        tagIds.length === 1
          ? eq(schema.tags.id, tagIds[0])
          : sql`${schema.tags.id} IN (${tagIds.join(',')})`
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
async function handleTagsUpdate(
  request: Request, 
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;
    const postId = parseInt(id);
    const { tags } = await request.json();

    if (isNaN(postId)) {
      return NextResponse.json(
        { error: 'Invalid post ID' },
        { status: 400 }
      );
    }

    if (!Array.isArray(tags)) {
      return NextResponse.json(
        { error: 'tags must be an array' },
        { status: 400 }
      );
    }

    // 检查文章是否存在
    const post = await db.query.posts.findFirst({
      where: eq(schema.posts.id, postId)
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // 使用事务处理标签更新
    await db.transaction(async (tx) => {
      // 1. 删除原有的文章-标签关联
      await tx
        .delete(schema.postTags)
        .where(eq(schema.postTags.postId, postId));

      // 2. 处理新的标签
      if (tags.length > 0) {
        // 创建新的标签（如果不存在）并获取所有标签的ID
        const tagIds = await Promise.all(
          tags.map(async (tag) => {
            // 如果提供了ID，检查标签是否存在
            if (tag.id) {
              const existingTag = await tx.query.tags.findFirst({
                where: eq(schema.tags.id, tag.id)
              });
              
              if (existingTag) {
                return existingTag.id;
              }
            }
            
            // 如果没有ID或ID无效，检查名称是否存在
            if (tag.name) {
              const slug = tag.slug || generateSlug(tag.name);
              
              const existingTag = await tx.query.tags.findFirst({
                where: or(
                  eq(schema.tags.name, tag.name),
                  eq(schema.tags.slug, slug)
                )
              });
              
              if (existingTag) {
                return existingTag.id;
              }
              
              // 创建新标签
              const newTag = await tx
                .insert(schema.tags)
                .values({
                  name: tag.name,
                  slug,
                  description: tag.description || null
                })
                .returning()
                .get();
              
              return newTag.id;
            }
            
            return null;
          })
        );
        
        // 过滤掉无效的标签ID
        const validTagIds = tagIds.filter(id => id !== null);
        
        // 3. 创建新的文章-标签关联
        if (validTagIds.length > 0) {
          const postTagsData = validTagIds.map(tagId => ({
            postId,
            tagId
          }));
          
          await tx.insert(schema.postTags).values(postTagsData);
        }
      }
    });
    
    // 获取更新后的标签
    const updatedPostTags = await db
      .select()
      .from(schema.postTags)
      .where(eq(schema.postTags.postId, postId));
    
    if (!updatedPostTags.length) {
      return NextResponse.json([]);
    }
    
    const updatedTagIds = updatedPostTags.map(pt => pt.tagId);
    const updatedTags = await db
      .select()
      .from(schema.tags)
      .where(
        updatedTagIds.length === 1
          ? eq(schema.tags.id, updatedTagIds[0])
          : sql`${schema.tags.id} IN (${updatedTagIds.join(',')})`
      );
    
    return NextResponse.json(updatedTags);
  } catch (error) {
    console.error('Error updating post tags:', error);
    return NextResponse.json(
      { error: 'Failed to update post tags' },
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
