import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/schema';
import { eq, and, or } from 'drizzle-orm';
import { generateSlug } from '@/lib/utils';

// GET 获取单个标签
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
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
        { error: 'Tag not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(tag);
  } catch (error) {
    console.error('Error fetching tag:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tag' },
      { status: 500 }
    );
  }
}

// PATCH 更新标签
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug: paramSlug } = await params;
    const { name, slug, description } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Tag name is required' },
        { status: 400 }
      );
    }

    // 检查是否是数字 ID
    const isId = /^\d+$/.test(paramSlug);

    // 检查标签是否存在
    let existingTag;
    if (isId) {
      // 如果是数字 ID，按 ID 查询
      existingTag = await db.query.tags.findFirst({
        where: eq(schema.tags.id, parseInt(paramSlug))
      });
    } else {
      // 否则按 slug 查询
      existingTag = await db.query.tags.findFirst({
        where: eq(schema.tags.slug, paramSlug)
      });
    }

    if (!existingTag) {
      return NextResponse.json(
        { error: 'Tag not found' },
        { status: 404 }
      );
    }

    // 生成 slug（如果未提供）
    const tagSlug = slug?.trim() || generateSlug(name.trim());

    // 检查 slug 是否已存在（排除当前标签）
    const slugExists = await db.query.tags.findFirst({
      where: and(
        eq(schema.tags.slug, tagSlug),
        or(
          isId
            ? eq(schema.tags.id, parseInt(paramSlug))
            : eq(schema.tags.slug, paramSlug)
        )
      )
    });

    if (slugExists && slugExists.id !== existingTag.id) {
      return NextResponse.json(
        { error: 'Slug already exists' },
        { status: 400 }
      );
    }

    // 更新标签
    const updatedTag = await db
      .update(schema.tags)
      .set({
        name: name.trim(),
        slug: tagSlug,
        description: description?.trim() || null
      })
      .where(eq(schema.tags.id, existingTag.id))
      .returning()
      .get();

    return NextResponse.json(updatedTag);
  } catch (error) {
    console.error('Error updating tag:', error);
    return NextResponse.json(
      { error: 'Failed to update tag' },
      { status: 500 }
    );
  }
}

// DELETE 删除标签
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug: paramSlug } = await params;
    // 检查是否是数字 ID
    const isId = /^\d+$/.test(paramSlug);

    // 检查标签是否存在
    let existingTag;
    if (isId) {
      // 如果是数字 ID，按 ID 查询
      existingTag = await db.query.tags.findFirst({
        where: eq(schema.tags.id, parseInt(paramSlug))
      });
    } else {
      // 否则按 slug 查询
      existingTag = await db.query.tags.findFirst({
        where: eq(schema.tags.slug, paramSlug)
      });
    }

    if (!existingTag) {
      return NextResponse.json(
        { error: 'Tag not found' },
        { status: 404 }
      );
    }

    // 删除标签与文章的关联
    await db
      .delete(schema.postTags)
      .where(eq(schema.postTags.tagId, existingTag.id));

    // 删除标签
    const deletedTag = await db
      .delete(schema.tags)
      .where(eq(schema.tags.id, existingTag.id))
      .returning()
      .get();

    return NextResponse.json(deletedTag);
  } catch (error) {
    console.error('Error deleting tag:', error);
    return NextResponse.json(
      { error: 'Failed to delete tag' },
      { status: 500 }
    );
  }
}
