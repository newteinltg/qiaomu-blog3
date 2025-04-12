import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

// 验证分类数据的 schema
const categorySchema = z.object({
  name: z.string().min(1, '分类名称不能为空'),
  slug: z.string().min(1, '分类别名不能为空'),
  description: z.string().optional(),
  parentId: z.number().nullable().optional(),
});

// GET 处理程序，获取单个分类
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 获取ID参数
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: '无效的分类ID' },
        { status: 400 }
      );
    }

    const category = await db.query.categories.findFirst({
      where: eq(schema.categories.id, id)
    });

    if (!category) {
      return NextResponse.json(
        { error: '分类不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error('获取分类失败:', error);
    return NextResponse.json(
      { error: '获取分类失败' },
      { status: 500 }
    );
  }
}

// PUT 处理程序，更新分类
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 获取ID参数
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: '无效的分类ID' },
        { status: 400 }
      );
    }

    // 检查分类是否存在
    const existingCategory = await db.query.categories.findFirst({
      where: eq(schema.categories.id, id)
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: '分类不存在' },
        { status: 404 }
      );
    }

    // 解析请求体
    const body = await request.json();
    
    // 验证请求数据
    const validationResult = categorySchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: '无效的分类数据', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { name, slug, description, parentId } = validationResult.data;

    // 检查别名是否已被使用（排除当前分类）
    const slugExists = await db.query.categories.findFirst({
      where: (categories) => {
        return eq(categories.slug, slug);
      }
    });

    if (slugExists && slugExists.id !== id) {
      return NextResponse.json(
        { error: '分类别名已被使用' },
        { status: 400 }
      );
    }

    // 如果设置了父分类，检查父分类是否存在
    if (parentId !== null && parentId !== undefined) {
      const parentExists = await db.query.categories.findFirst({
        where: eq(schema.categories.id, parentId)
      });

      if (!parentExists) {
        return NextResponse.json(
          { error: '父分类不存在' },
          { status: 400 }
        );
      }

      // 检查多级父子关系是否形成循环
      let currentParentId: number | null = parentId;
      const visitedParentIds = new Set<number>();

      while (currentParentId !== null) {
        if (visitedParentIds.has(currentParentId)) {
          return NextResponse.json(
            { error: '检测到循环的父子关系' },
            { status: 400 }
          );
        }

        visitedParentIds.add(currentParentId);

        // 明确定义类型
        const parentCat: { id: number; parentId: number | null } | undefined = await db.query.categories.findFirst({
          where: eq(schema.categories.id, currentParentId),
        });

        if (!parentCat) {
          break;
        }

        if (parentCat.id === id) {
          return NextResponse.json(
            { error: '检测到循环的父子关系' },
            { status: 400 }
          );
        }

        currentParentId = parentCat.parentId;
      }
    }

    // 更新分类
    await db
      .update(schema.categories)
      .set({
        name,
        slug,
        description: description || null,
        parentId: parentId === undefined ? existingCategory.parentId : parentId,
        updatedAt: new Date().toISOString()
      })
      .where(eq(schema.categories.id, id));

    // 获取更新后的分类
    const updatedCategory = await db.query.categories.findFirst({
      where: eq(schema.categories.id, id)
    });

    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error('更新分类失败:', error);
    return NextResponse.json(
      { error: '更新分类失败' },
      { status: 500 }
    );
  }
}

// DELETE 处理程序，删除分类
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 获取ID参数
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: '无效的分类ID' },
        { status: 400 }
      );
    }

    // 检查分类是否存在
    const existingCategory = await db.query.categories.findFirst({
      where: eq(schema.categories.id, id)
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: '分类不存在' },
        { status: 404 }
      );
    }

    // 检查是否有子分类
    const childCategories = await db.query.categories.findMany({
      where: eq(schema.categories.parentId, id)
    });

    if (childCategories.length > 0) {
      return NextResponse.json(
        { error: '无法删除有子分类的分类，请先删除或移动子分类' },
        { status: 400 }
      );
    }

    // 检查是否有关联的文章
    const relatedPosts = await db.query.postCategories.findMany({
      where: eq(schema.postCategories.categoryId, id)
    });

    if (relatedPosts.length > 0) {
      return NextResponse.json(
        { error: '无法删除有关联文章的分类，请先移除文章关联' },
        { status: 400 }
      );
    }

    // 删除分类
    await db
      .delete(schema.categories)
      .where(eq(schema.categories.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除分类失败:', error);
    return NextResponse.json(
      { error: '删除分类失败' },
      { status: 500 }
    );
  }
}
