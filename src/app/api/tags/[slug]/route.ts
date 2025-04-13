import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/schema';
import { eq, and, or } from 'drizzle-orm';
import { generateSlug } from '@/lib/utils';

// GET 获取单个标签
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // 获取slug参数
    const { slug } = await params;
    // 检查是否是数字 ID
    const isId = /^\d+$/.test(slug);

    let tag;
    if (isId) {
      // 如果是数字 ID，按 ID 查询
      tag = await db.query.tags.findFirst({
        where: eq(schema.tags.id, parseInt(slug))
      });
    } else {
      // 否则按 slug 查询
      tag = await db.query.tags.findFirst({
        where: eq(schema.tags.slug, slug)
      });
    }

    if (!tag) {
      return NextResponse.json(
        { error: '标签不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json(tag);
  } catch (error) {
    console.error('获取标签失败:', error);
    return NextResponse.json(
      { error: '获取标签失败' },
      { status: 500 }
    );
  }
}

// PATCH 更新标签
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // 获取slug参数
    const { slug } = await params;
    const body = await request.json();
    
    // 验证请求体
    if (!body.name) {
      return NextResponse.json(
        { error: '标签名称不能为空' },
        { status: 400 }
      );
    }
    
    // 生成 slug（如果没有提供）
    if (!body.slug) {
      body.slug = generateSlug(body.name);
    }
    
    // 查找要更新的标签
    let tag;
    // 检查是否是数字 ID
    const isId = /^\d+$/.test(slug);
    
    if (isId) {
      // 如果是数字 ID，按 ID 查询
      tag = await db.query.tags.findFirst({
        where: eq(schema.tags.id, parseInt(slug))
      });
    } else {
      // 否则按 slug 查询
      tag = await db.query.tags.findFirst({
        where: eq(schema.tags.slug, slug)
      });
    }
    
    if (!tag) {
      return NextResponse.json(
        { error: '标签不存在' },
        { status: 404 }
      );
    }
    
    // 检查新的 slug 是否已被使用
    if (body.slug !== tag.slug) {
      const existingTag = await db.query.tags.findFirst({
        where: eq(schema.tags.slug, body.slug)
      });
      
      if (existingTag) {
        return NextResponse.json(
          { error: '标签别名已被使用' },
          { status: 400 }
        );
      }
    }
    
    // 更新标签
    await db
      .update(schema.tags)
      .set({
        name: body.name,
        slug: body.slug,
        description: body.description || null
      })
      .where(eq(schema.tags.id, tag.id));
    
    // 获取更新后的标签
    const updatedTag = await db.query.tags.findFirst({
      where: eq(schema.tags.id, tag.id)
    });
    
    return NextResponse.json(updatedTag);
  } catch (error) {
    console.error('更新标签失败:', error);
    return NextResponse.json(
      { error: '更新标签失败' },
      { status: 500 }
    );
  }
}

// DELETE 删除标签
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // 获取slug参数
    const { slug } = await params;
    
    // 查找要删除的标签
    let tag;
    // 检查是否是数字 ID
    const isId = /^\d+$/.test(slug);
    
    if (isId) {
      // 如果是数字 ID，按 ID 查询
      tag = await db.query.tags.findFirst({
        where: eq(schema.tags.id, parseInt(slug))
      });
    } else {
      // 否则按 slug 查询
      tag = await db.query.tags.findFirst({
        where: eq(schema.tags.slug, slug)
      });
    }
    
    if (!tag) {
      return NextResponse.json(
        { error: '标签不存在' },
        { status: 404 }
      );
    }
    
    // 删除标签与文章的关联
    await db
      .delete(schema.postTags)
      .where(eq(schema.postTags.tagId, tag.id));
    
    // 删除标签
    await db
      .delete(schema.tags)
      .where(eq(schema.tags.id, tag.id));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除标签失败:', error);
    return NextResponse.json(
      { error: '删除标签失败' },
      { status: 500 }
    );
  }
}
