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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 使用 await 解包 params
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 获取分类ID
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: '无效的分类ID' },
        { status: 400 }
      );
    }

    // 检查分类是否存在
    const existingCategory = await db.select()
      .from(schema.categories)
      .where(eq(schema.categories.id, id))
      .limit(1)
      .then(results => results[0] || null);

    if (!existingCategory) {
      return NextResponse.json(
        { error: '分类不存在' },
        { status: 404 }
      );
    }

    const body = await request.json();
    
    // 验证数据
    const validatedData = categorySchema.parse(body);
    
    // 如果名称已更改，检查是否与其他分类冲突
    if (validatedData.name !== existingCategory.name) {
      const categoryWithSameName = await db.select()
        .from(schema.categories)
        .where(eq(schema.categories.name, validatedData.name))
        .limit(1)
        .then(results => results[0] || null);
      
      if (categoryWithSameName && categoryWithSameName.id !== id) {
        return NextResponse.json(
          { error: '分类名称已存在' },
          { status: 400 }
        );
      }
    }
    
    // 如果别名已更改，检查是否与其他分类冲突
    if (validatedData.slug !== existingCategory.slug) {
      const categoryWithSameSlug = await db.select()
        .from(schema.categories)
        .where(eq(schema.categories.slug, validatedData.slug))
        .limit(1)
        .then(results => results[0] || null);
      
      if (categoryWithSameSlug && categoryWithSameSlug.id !== id) {
        return NextResponse.json(
          { error: '分类别名已存在' },
          { status: 400 }
        );
      }
    }
    
    // 检查父级分类设置是否会导致循环引用
    if (validatedData.parentId !== null && validatedData.parentId !== undefined) {
      // 不能将自己设为父级
      if (validatedData.parentId === id) {
        return NextResponse.json(
          { error: '分类不能将自己设为父级' },
          { status: 400 }
        );
      }
      
      // 检查父级分类是否存在
      const parentCategory = await db.select()
        .from(schema.categories)
        .where(eq(schema.categories.id, validatedData.parentId))
        .limit(1)
        .then(results => results[0] || null);
      
      if (!parentCategory) {
        return NextResponse.json(
          { error: '父级分类不存在' },
          { status: 400 }
        );
      }
      
      // 检查是否会形成循环引用
      let currentParentId = parentCategory.parentId;
      while (currentParentId !== null) {
        if (currentParentId === id) {
          return NextResponse.json(
            { error: '不能将分类设为其子分类的子分类，这会造成循环引用' },
            { status: 400 }
          );
        }
        
        const currentParent = await db.select()
          .from(schema.categories)
          .where(eq(schema.categories.id, currentParentId))
          .limit(1)
          .then(results => results[0] || null);
        
        if (!currentParent) break;
        currentParentId = currentParent.parentId;
      }
    }
    
    // 更新分类
    const updatedCategory = await db
      .update(schema.categories)
      .set({
        name: validatedData.name,
        slug: validatedData.slug,
        description: validatedData.description || null,
        parentId: validatedData.parentId,
        updatedAt: new Date().toISOString()
      })
      .where(eq(schema.categories.id, id))
      .returning();
    
    return NextResponse.json(updatedCategory[0] || { 
      success: true, 
      message: '分类更新成功' 
    });
  } catch (error) {
    console.error('更新分类失败:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '数据验证失败', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: '更新分类失败' },
      { status: 500 }
    );
  }
}

// DELETE 处理程序，删除分类
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 获取分类ID
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: '无效的分类ID' },
        { status: 400 }
      );
    }
    
    // 检查分类是否存在
    const existingCategory = await db.select()
      .from(schema.categories)
      .where(eq(schema.categories.id, id))
      .limit(1)
      .then(results => results[0] || null);

    if (!existingCategory) {
      return NextResponse.json(
        { error: '分类不存在' },
        { status: 404 }
      );
    }
    
    // 检查是否为"未分类"分类（通常是 slug 为 'uncategorized' 的分类）
    if (existingCategory.slug === 'uncategorized') {
      return NextResponse.json(
        { error: '无法删除"未分类"分类，这是系统默认分类' },
        { status: 400 }
      );
    }
    
    // 开始数据库事务
    return await db.transaction(async (tx) => {
      // 查找未分类的分类ID
      const uncategorizedCategory = await tx.select()
        .from(schema.categories)
        .where(eq(schema.categories.slug, 'uncategorized'))
        .limit(1)
        .then(results => results[0] || null);
      
      if (!uncategorizedCategory) {
        return NextResponse.json(
          { error: '系统错误：未找到"未分类"分类' },
          { status: 500 }
        );
      }
      
      // 处理该分类下的文章，将它们移到"未分类"
      await tx
        .update(schema.posts)
        .set({ categoryId: uncategorizedCategory.id })
        .where(eq(schema.posts.categoryId, id));
      
      // 处理子分类，将它们变为顶级分类
      await tx
        .update(schema.categories)
        .set({ parentId: null })
        .where(eq(schema.categories.parentId, id));
      
      // 删除分类
      await tx
        .delete(schema.categories)
        .where(eq(schema.categories.id, id));
      
      return NextResponse.json({ 
        success: true, 
        message: '分类删除成功' 
      });
    });
  } catch (error) {
    console.error('删除分类失败:', error);
    return NextResponse.json(
      { error: '删除分类失败', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
