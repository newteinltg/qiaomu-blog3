import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/schema';
import { eq, or, sql } from 'drizzle-orm';
import { generateSlug } from '@/lib/utils';

// GET 获取文章的所有标签
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const postId = parseInt(id);

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

    // 获取文章的所有标签
    const postTagsRelations = await db
      .select()
      .from(schema.postTags)
      .where(eq(schema.postTags.postId, postId));

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
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const postId = parseInt(id);
    const requestBody = await request.json();
    
    // 确保请求体中包含tags字段
    if (!requestBody || !requestBody.tags) {
      return NextResponse.json(
        { error: 'Missing tags field in request body' },
        { status: 400 }
      );
    }
    
    const { tags } = requestBody;

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

    console.log(`处理文章 ${postId} 的标签更新，标签数量: ${tags.length}`);

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
            try {
              // 如果提供了ID，检查标签是否存在
              if (tag.id || tag.id === 0) {
                const existingTag = await tx.query.tags.findFirst({
                  where: eq(schema.tags.id, tag.id)
                });
                
                if (existingTag) {
                  return existingTag.id;
                }
              }
              
              // 使用value字段作为标签名称（Tagify格式）
              const tagName = tag.value || tag.name;
              
              // 如果没有ID或ID无效，检查名称是否存在
              if (tagName) {
                const slug = tag.slug || generateSlug(tagName);
                
                const existingTag = await tx.query.tags.findFirst({
                  where: or(
                    eq(schema.tags.name, tagName),
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
                    name: tagName,
                    slug,
                    description: tag.description || null
                  })
                  .returning()
                  .get();
                
                return newTag.id;
              }
            } catch (error) {
              console.error(`处理标签时出错:`, error, tag);
            }
            
            return null;
          })
        );
        
        // 过滤掉无效的标签ID
        const validTagIds = tagIds.filter(id => id !== null);
        
        console.log(`有效标签ID数量: ${validTagIds.length}`);
        
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
    
    console.log(`文章 ${postId} 的标签更新成功，更新后标签数量: ${updatedTags.length}`);
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
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleTagsUpdate(request, { params });
}

// PUT 更新文章的标签 (与 POST 功能相同，为了兼容性)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleTagsUpdate(request, { params });
}
