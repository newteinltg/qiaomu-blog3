import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/schema';
import { eq, and, gt, lt, sql, isNull } from 'drizzle-orm';

// 重新排序分类
export async function POST(request: NextRequest) {
  try {
    const { activeId, overId, newParentId = undefined } = await request.json();

    // 验证输入
    if (!activeId || !overId) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 获取被拖拽的分类
    const activeCategory = await db.select()
      .from(schema.categories)
      .where(eq(schema.categories.id, activeId))
      .limit(1)
      .then(results => results[0] || null);

    // 获取目标位置的分类
    const overCategory = await db.select()
      .from(schema.categories)
      .where(eq(schema.categories.id, overId))
      .limit(1)
      .then(results => results[0] || null);

    if (!activeCategory || !overCategory) {
      return NextResponse.json(
        { error: '找不到指定的分类' },
        { status: 404 }
      );
    }

    // 如果没有指定新的父分类ID，则使用目标分类的父分类ID
    const effectiveNewParentId = newParentId !== undefined ? newParentId : overCategory.parentId;

    // 防止循环引用
    if (effectiveNewParentId === activeId) {
      return NextResponse.json(
        { error: '不能将分类设为自己的子分类' },
        { status: 400 }
      );
    }

    // 检查是否尝试将分类设置为其子分类的子分类
    if (effectiveNewParentId !== null && effectiveNewParentId !== overCategory.parentId) {
      const isChildOf = await checkIsChildOf(effectiveNewParentId, activeId);
      if (isChildOf) {
        return NextResponse.json(
          { error: '不能将分类移动到其子分类中' },
          { status: 400 }
        );
      }
    }

    // 开始事务
    await db.transaction(async (tx) => {
      // 1. 如果父分类发生变化，需要更新
      if (activeCategory.parentId !== effectiveNewParentId) {
        if (effectiveNewParentId === null) {
          await tx.update(schema.categories)
            .set({ parentId: null })
            .where(eq(schema.categories.id, activeId));
        } else {
          await tx.update(schema.categories)
            .set({ parentId: effectiveNewParentId })
            .where(eq(schema.categories.id, activeId));
        }
      }

      // 2. 更新排序
      // 如果在同一个父分类下排序
      const activeParentId = effectiveNewParentId !== undefined ? effectiveNewParentId : activeCategory.parentId;
      const overParentId = overCategory.parentId;
      
      const isSameParent = 
        (activeParentId === null && overParentId === null) || 
        (activeParentId !== null && overParentId !== null && activeParentId === overParentId);
      
      if (isSameParent) {
        // 向下移动
        if (activeCategory.order < overCategory.order) {
          if (activeParentId === null) {
            await tx.update(schema.categories)
              .set({ order: sql`${schema.categories.order} - 1` })
              .where(
                and(
                  isNull(schema.categories.parentId),
                  gt(schema.categories.order, activeCategory.order),
                  lt(schema.categories.order, overCategory.order + 1)
                )
              );
          } else {
            await tx.update(schema.categories)
              .set({ order: sql`${schema.categories.order} - 1` })
              .where(
                and(
                  eq(schema.categories.parentId, activeParentId),
                  gt(schema.categories.order, activeCategory.order),
                  lt(schema.categories.order, overCategory.order + 1)
                )
              );
          }
          
          await tx.update(schema.categories)
            .set({ order: overCategory.order })
            .where(eq(schema.categories.id, activeId));
        } 
        // 向上移动
        else if (activeCategory.order > overCategory.order) {
          if (activeParentId === null) {
            await tx.update(schema.categories)
              .set({ order: sql`${schema.categories.order} + 1` })
              .where(
                and(
                  isNull(schema.categories.parentId),
                  lt(schema.categories.order, activeCategory.order),
                  gt(schema.categories.order, overCategory.order - 1)
                )
              );
          } else {
            await tx.update(schema.categories)
              .set({ order: sql`${schema.categories.order} + 1` })
              .where(
                and(
                  eq(schema.categories.parentId, activeParentId),
                  lt(schema.categories.order, activeCategory.order),
                  gt(schema.categories.order, overCategory.order - 1)
                )
              );
          }
          
          await tx.update(schema.categories)
            .set({ order: overCategory.order })
            .where(eq(schema.categories.id, activeId));
        }
      } 
      // 跨父分类移动
      else {
        // 1. 更新原父分类下的排序
        if (activeCategory.parentId === null) {
          await tx.update(schema.categories)
            .set({ order: sql`${schema.categories.order} - 1` })
            .where(
              and(
                isNull(schema.categories.parentId),
                gt(schema.categories.order, activeCategory.order)
              )
            );
        } else {
          await tx.update(schema.categories)
            .set({ order: sql`${schema.categories.order} - 1` })
            .where(
              and(
                eq(schema.categories.parentId, activeCategory.parentId),
                gt(schema.categories.order, activeCategory.order)
              )
            );
        }
        
        // 2. 更新新父分类下的排序
        if (effectiveNewParentId === null) {
          await tx.update(schema.categories)
            .set({ order: sql`${schema.categories.order} + 1` })
            .where(
              and(
                isNull(schema.categories.parentId),
                gt(schema.categories.order, overCategory.order)
              )
            );
        } else {
          await tx.update(schema.categories)
            .set({ order: sql`${schema.categories.order} + 1` })
            .where(
              and(
                eq(schema.categories.parentId, effectiveNewParentId),
                gt(schema.categories.order, overCategory.order)
              )
            );
        }
        
        // 3. 设置被拖拽分类的新顺序
        await tx.update(schema.categories)
          .set({ order: overCategory.order + 1 })
          .where(eq(schema.categories.id, activeId));
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('重新排序分类出错:', error);
    return NextResponse.json(
      { error: '重新排序分类失败' },
      { status: 500 }
    );
  }
}

// 检查一个分类是否是另一个分类的子分类
async function checkIsChildOf(childId: number, parentId: number): Promise<boolean> {
  const child = await db.select()
    .from(schema.categories)
    .where(eq(schema.categories.id, childId))
    .limit(1)
    .then(results => results[0] || null);
  
  if (!child || child.parentId === null) return false;
  if (child.parentId === parentId) return true;
  
  return checkIsChildOf(child.parentId, parentId);
}
