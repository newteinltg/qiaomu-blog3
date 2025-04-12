import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/schema';
import { eq, and, gt, lt, sql, isNull, asc, desc, gte, ne } from 'drizzle-orm';

// 重新排序菜单
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 验证请求数据
    if (!body.activeId) {
      return NextResponse.json({ error: '缺少必要参数: activeId' }, { status: 400 });
    }
    
    // 提取参数
    const { activeId, overId, newParentId, position } = body;
    
    // 验证位置参数
    if (!['before', 'after', 'inside', 'root'].includes(position)) {
      return NextResponse.json({ error: '无效的位置参数' }, { status: 400 });
    }
    
    console.log(`重排序请求: activeId=${activeId}, overId=${overId}, newParentId=${newParentId}, position=${position}`);
    
    // 获取需要移动的菜单
    const activeMenu = await db.select().from(schema.menus).where(eq(schema.menus.id, activeId)).then(results => results[0]);
    
    if (!activeMenu) {
      return NextResponse.json({ error: '找不到要移动的菜单' }, { status: 404 });
    }
    
    // 如果不是移动到根级别，则需要获取目标菜单
    let overMenu = null;
    if (position !== 'root' && overId) {
      overMenu = await db.select().from(schema.menus).where(eq(schema.menus.id, overId)).then(results => results[0]);
      
      if (!overMenu) {
        return NextResponse.json({ error: '找不到目标菜单' }, { status: 404 });
      }
    }
    
    // 检查是否会导致循环引用
    if (position === 'inside' && overId) {
      // 检查目标菜单是否是当前菜单的子菜单
      const isCircular = await checkCircularReference(activeId, overId);
      
      if (isCircular) {
        return NextResponse.json({ error: '不能将菜单移动到其子菜单下，这会导致循环引用' }, { status: 400 });
      }
    }
    
    // 确定新的父ID
    let effectiveNewParentId = newParentId;
    
    // 根据position确定新的父ID
    if (position === 'inside' && overMenu) {
      // 放在菜单内部，成为其子菜单
      effectiveNewParentId = overMenu.id;
      console.log('菜单将成为子菜单, 新父ID:', effectiveNewParentId);
    } 
    else if ((position === 'before' || position === 'after') && overMenu) {
      // 放在菜单前面或后面，与目标菜单同级
      effectiveNewParentId = overMenu.parentId;
      console.log('菜单将与目标同级, 新父ID:', effectiveNewParentId);
    }
    // 如果position是root，则设置父ID为null
    else if (position === 'root') {
      effectiveNewParentId = null;
      console.log('菜单将成为顶级菜单, 新父ID:', effectiveNewParentId);
    }
    
    // 防止循环引用
    if (effectiveNewParentId === activeId) {
      return NextResponse.json({ error: '菜单不能成为自己的子菜单' }, { status: 400 });
    }
    
    // 检查是否会形成循环引用
    if (effectiveNewParentId !== null && effectiveNewParentId !== undefined) {
      let currentParentId = effectiveNewParentId;
      const visited = new Set([activeId]);
      
      while (currentParentId !== null) {
        if (visited.has(currentParentId)) {
          return NextResponse.json({ error: '检测到循环引用，无法移动菜单' }, { status: 400 });
        }
        
        visited.add(currentParentId);
        
        const currentParent = await db.select().from(schema.menus).where(eq(schema.menus.id, currentParentId)).then(results => results[0]);
        
        if (!currentParent) break;
        currentParentId = currentParent.parentId;
      }
    }
    
    // 执行事务
    await db.transaction(async (tx) => {
      // 更新被移动菜单的父ID
      await tx.update(schema.menus)
        .set({ 
          parentId: effectiveNewParentId,
          updatedAt: new Date().toISOString()
        })
        .where(eq(schema.menus.id, activeId));
      
      // 获取同级菜单列表（用于重新排序）
      let siblingMenus;
      if (effectiveNewParentId === null) {
        // 获取顶级菜单
        siblingMenus = await tx.select()
          .from(schema.menus)
          .where(isNull(schema.menus.parentId))
          .orderBy(asc(schema.menus.order));
      } else {
        // 获取同一父菜单下的子菜单
        siblingMenus = await tx.select()
          .from(schema.menus)
          .where(eq(schema.menus.parentId, effectiveNewParentId))
          .orderBy(asc(schema.menus.order));
      }
      
      // 根据position确定新的顺序
      if (position === 'before' && overMenu) {
        // 设置为目标菜单的顺序
        const targetOrder = overMenu.order;
        
        // 更新被拖拽菜单的顺序
        await tx.update(schema.menus)
          .set({ order: targetOrder })
          .where(eq(schema.menus.id, activeId));
        
        // 将目标菜单及之后的菜单顺序+1
        await tx.update(schema.menus)
          .set({ 
            order: sql`${schema.menus.order} + 1`,
            updatedAt: new Date().toISOString()
          })
          .where(
            and(
              effectiveNewParentId === null || effectiveNewParentId === undefined
                ? isNull(schema.menus.parentId)
                : eq(schema.menus.parentId, effectiveNewParentId),
              gte(schema.menus.order, targetOrder),
              ne(schema.menus.id, activeId)
            )
          );
      } 
      else if (position === 'after' && overMenu) {
        // 设置为目标菜单的顺序+1
        const targetOrder = overMenu.order + 1;
        
        // 更新被拖拽菜单的顺序
        await tx.update(schema.menus)
          .set({ order: targetOrder })
          .where(eq(schema.menus.id, activeId));
        
        // 将目标菜单之后的菜单顺序+1
        await tx.update(schema.menus)
          .set({ 
            order: sql`${schema.menus.order} + 1`,
            updatedAt: new Date().toISOString()
          })
          .where(
            and(
              effectiveNewParentId === null || effectiveNewParentId === undefined
                ? isNull(schema.menus.parentId)
                : eq(schema.menus.parentId, effectiveNewParentId),
              gt(schema.menus.order, overMenu.order),
              ne(schema.menus.id, activeId)
            )
          );
      }
      else if (position === 'inside') {
        // 获取子菜单中的最大顺序
        const maxOrderResult = await tx.select({
          maxOrder: schema.menus.order
        })
        .from(schema.menus)
        .where(eq(schema.menus.parentId, effectiveNewParentId))
        .orderBy(desc(schema.menus.order))
        .limit(1)
        .then(results => results[0]);
        
        const maxOrder = maxOrderResult?.maxOrder || 0;
        
        // 设置为子菜单中的最后一个
        await tx.update(schema.menus)
          .set({ order: maxOrder + 10 })
          .where(eq(schema.menus.id, activeId));
      }
      else if (position === 'root') {
        // 获取顶级菜单中的最大顺序
        const maxOrderResult = await tx.select({
          maxOrder: schema.menus.order
        })
        .from(schema.menus)
        .where(isNull(schema.menus.parentId))
        .orderBy(desc(schema.menus.order))
        .limit(1)
        .then(results => results[0]);
        
        const maxOrder = maxOrderResult?.maxOrder || 0;
        
        // 设置为顶级菜单中的最后一个
        await tx.update(schema.menus)
          .set({ 
            order: maxOrder + 10,
            parentId: null // 确保设置为顶级菜单
          })
          .where(eq(schema.menus.id, activeId));
      }
    });
    
    // 获取更新后的菜单列表
    const updatedMenus = await db.select()
      .from(schema.menus)
      .orderBy(asc(schema.menus.parentId), asc(schema.menus.order));
    
    return NextResponse.json({ 
      success: true,
      menus: updatedMenus
    });
  } catch (error) {
    console.error('菜单重排序出错:', error);
    return NextResponse.json({ error: '菜单重排序失败' }, { status: 500 });
  }
}

// 检查一个菜单是否是另一个菜单的子菜单
async function checkCircularReference(childId: number, parentId: number): Promise<boolean> {
  const child = await db.select().from(schema.menus).where(eq(schema.menus.id, childId)).then(results => results[0]);
  
  if (!child || child.parentId === null) return false;
  if (child.parentId === parentId) return true;
  
  return checkCircularReference(child.parentId, parentId);
}
