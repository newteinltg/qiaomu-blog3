import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/schema';
import { eq, desc, and, gt, lt } from 'drizzle-orm';
import { z } from 'zod';

// 验证菜单数据的 schema
const menuSchema = z.object({
  name: z.string().min(1, '菜单名称不能为空'),
  description: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  isExternal: z.union([z.boolean(), z.number()]).optional().transform(val => 
    typeof val === 'number' ? Boolean(val) : val
  ),
  parentId: z.number().nullable().optional(),
  order: z.number().optional(),
  isActive: z.union([z.boolean(), z.number()]).optional().transform(val => 
    typeof val === 'number' ? Boolean(val) : val
  ),
});

// GET 获取单个菜单
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('获取单个菜单, ID:', params.id);
    
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: '无效的菜单ID' },
        { status: 400 }
      );
    }
    
    const menu = await db.select()
      .from(schema.menus)
      .where(eq(schema.menus.id, id))
      .limit(1)
      .then(results => results[0] || null);

    if (!menu) {
      console.log('菜单未找到');
      return NextResponse.json(
        { error: '菜单未找到' },
        { status: 404 }
      );
    }
    
    console.log('获取到菜单:', menu);

    return NextResponse.json(menu);
  } catch (error) {
    console.error('获取菜单出错:', error);
    return NextResponse.json(
      { error: '获取菜单失败' },
      { status: 500 }
    );
  }
}

// PATCH 更新菜单
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 克隆请求以避免多次读取请求体
    const clonedRequest = request.clone();
    const body = await clonedRequest.json();
    const { name, description, url, isExternal, parentId, order, isActive } = body;
    
    console.log('PATCH 更新菜单请求数据:', { id: params.id, name, description, url, isExternal, parentId, order, isActive });
    
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: '无效的菜单ID' },
        { status: 400 }
      );
    }
    
    // 验证必填字段
    if (!name || name.trim() === '') {
      console.log('菜单名称为空');
      return NextResponse.json(
        { error: '菜单名称不能为空' },
        { status: 400 }
      );
    }
    
    // 检查菜单是否存在
    const existingMenu = await db.select()
      .from(schema.menus)
      .where(eq(schema.menus.id, id))
      .limit(1)
      .then(results => results[0] || null);
    
    if (!existingMenu) {
      console.log('菜单未找到');
      return NextResponse.json(
        { error: '菜单未找到' },
        { status: 404 }
      );
    }
    
    // 检查父级菜单是否存在及循环引用
    if (parentId !== null && parentId !== undefined) {
      // 不能将自己设为自己的父级
      if (id === parentId) {
        console.log('不能将菜单设为自己的父级');
        return NextResponse.json(
          { error: '不能将菜单设为自己的父级' },
          { status: 400 }
        );
      }
      
      const parentMenu = await db.select()
        .from(schema.menus)
        .where(eq(schema.menus.id, parentId))
        .limit(1)
        .then(results => results[0] || null);
      
      if (!parentMenu) {
        console.log('父级菜单未找到');
        return NextResponse.json(
          { error: '父级菜单未找到' },
          { status: 400 }
        );
      }
      
      // 检查是否会形成循环引用
      let currentParentId = parentMenu.parentId;
      while (currentParentId !== null) {
        if (currentParentId === id) {
          return NextResponse.json(
            { error: '不能将菜单设为其子菜单的子菜单，这会造成循环引用' },
            { status: 400 }
          );
        }
        
        const currentParent = await db.select()
          .from(schema.menus)
          .where(eq(schema.menus.id, currentParentId))
          .limit(1)
          .then(results => results[0] || null);
        
        if (!currentParent) break;
        currentParentId = currentParent.parentId;
      }
    }
    
    // 更新菜单
    const updatedMenu = await db
      .update(schema.menus)
      .set({
        name: name.trim(),
        description: description?.trim() || null,
        url: url?.trim() || null,
        isExternal: isExternal || false,
        parentId: parentId === undefined ? existingMenu.parentId : parentId,
        order: order !== undefined ? order : existingMenu.order,
        isActive: isActive !== undefined ? isActive : existingMenu.isActive,
        updatedAt: new Date().toISOString()
      })
      .where(eq(schema.menus.id, id))
      .returning();
    
    console.log('菜单更新成功:', updatedMenu[0]);
    
    return NextResponse.json({ 
      success: true,
      menu: updatedMenu[0]
    });
  } catch (error) {
    console.error('更新菜单出错:', error);
    return NextResponse.json(
      { error: '更新菜单失败' },
      { status: 500 }
    );
  }
}

// PUT 更新菜单
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('PUT 更新菜单请求开始:', { id: params.id });
    
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: '无效的菜单ID' },
        { status: 400 }
      );
    }
    
    // 检查菜单是否存在
    const existingMenu = await db.select()
      .from(schema.menus)
      .where(eq(schema.menus.id, id))
      .limit(1)
      .then(results => results[0] || null);
    
    if (!existingMenu) {
      return NextResponse.json(
        { error: '菜单不存在' },
        { status: 404 }
      );
    }
    
    // 解析请求体
    const requestBody = await request.json();
    console.log('收到的请求体:', requestBody);
    
    // 验证请求数据
    const validationResult = menuSchema.safeParse(requestBody);
    if (!validationResult.success) {
      console.error('菜单数据验证失败:', validationResult.error);
      return NextResponse.json(
        { 
          error: '菜单数据验证失败', 
          details: validationResult.error.errors.map(e => `${e.path}: ${e.message}`).join(', ') 
        },
        { status: 400 }
      );
    }
    
    const { name, description, url, isExternal, parentId, order, isActive } = validationResult.data;
    
    console.log('PUT 更新菜单请求数据:', { id, name, description, url, isExternal, parentId, order, isActive });
    
    // 检查父级菜单设置是否会导致循环引用
    if (parentId !== null && parentId !== undefined) {
      // 不能将自己设为父级
      if (parentId === id) {
        return NextResponse.json(
          { error: '菜单不能将自己设为父级' },
          { status: 400 }
        );
      }
      
      // 检查父级菜单是否存在
      const parentMenu = await db.select()
        .from(schema.menus)
        .where(eq(schema.menus.id, parentId))
        .limit(1)
        .then(results => results[0] || null);
      
      if (!parentMenu) {
        return NextResponse.json(
          { error: '父级菜单不存在' },
          { status: 400 }
        );
      }
      
      // 检查是否会形成循环引用
      let currentParentId = parentMenu.parentId;
      const visited = new Set([parentId]);
      
      while (currentParentId !== null) {
        if (visited.has(currentParentId)) {
          return NextResponse.json(
            { error: '检测到循环引用，请选择其他父级菜单' },
            { status: 400 }
          );
        }
        
        if (currentParentId === id) {
          return NextResponse.json(
            { error: '检测到循环引用，请选择其他父级菜单' },
            { status: 400 }
          );
        }
        
        visited.add(currentParentId);
        
        const parent = await db.select()
          .from(schema.menus)
          .where(eq(schema.menus.id, currentParentId))
          .limit(1)
          .then(results => results[0] || null);
        
        if (!parent) break;
        
        currentParentId = parent.parentId;
      }
    }
    
    // 如果只更新了排序，则调用专门的排序更新函数
    if (
      order !== undefined && 
      Object.keys(validationResult.data).length === 1 && 
      'order' in validationResult.data
    ) {
      console.log('仅更新菜单排序');
      return updateMenuOrder(request, params, order);
    }
    
    // 更新菜单
    const updatedMenu = await db
      .update(schema.menus)
      .set({
        name: name?.trim() || existingMenu.name,
        description: description?.trim() || null,
        url: url?.trim() || null,
        isExternal: isExternal !== undefined ? Number(Boolean(isExternal)) : existingMenu.isExternal,
        parentId: parentId !== undefined ? parentId : existingMenu.parentId,
        order: order !== undefined ? order : existingMenu.order,
        isActive: isActive !== undefined ? Number(Boolean(isActive)) : existingMenu.isActive,
        updatedAt: new Date().toISOString()
      })
      .where(eq(schema.menus.id, id))
      .returning();
    
    console.log('菜单更新成功:', updatedMenu[0]);
    
    return NextResponse.json(updatedMenu[0] || { success: true });
  } catch (error) {
    console.error('更新菜单失败:', error);
    return NextResponse.json(
      { error: '更新菜单失败', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// 更新菜单排序的辅助函数
async function updateMenuOrder(
  request: Request,
  params: { id: string },
  order: number
) {
  try {
    console.log('更新菜单排序:', { id: params.id, order });
    
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: '无效的菜单ID' },
        { status: 400 }
      );
    }
    
    // 检查菜单是否存在
    const existingMenu = await db.select()
      .from(schema.menus)
      .where(eq(schema.menus.id, id))
      .limit(1)
      .then(results => results[0] || null);
    
    if (!existingMenu) {
      return NextResponse.json(
        { error: '菜单不存在' },
        { status: 404 }
      );
    }
    
    // 更新菜单排序
    const updatedMenu = await db
      .update(schema.menus)
      .set({
        order: order,
        updatedAt: new Date().toISOString()
      })
      .where(eq(schema.menus.id, id))
      .returning();
    
    return NextResponse.json(updatedMenu[0] || { 
      success: true, 
      message: '菜单排序更新成功' 
    });
  } catch (error) {
    console.error('更新菜单排序失败:', error);
    return NextResponse.json(
      { error: '更新菜单排序失败', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// DELETE 删除菜单
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('删除菜单, ID:', params.id);
    
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: '无效的菜单ID' },
        { status: 400 }
      );
    }
    
    // 检查菜单是否存在
    const existingMenu = await db.select()
      .from(schema.menus)
      .where(eq(schema.menus.id, id))
      .limit(1)
      .then(results => results[0] || null);
    
    if (!existingMenu) {
      console.log('菜单未找到');
      return NextResponse.json(
        { error: '菜单未找到' },
        { status: 404 }
      );
    }
    
    // 检查是否有子菜单
    const childMenus = await db.select()
      .from(schema.menus)
      .where(eq(schema.menus.parentId, id));
    
    if (childMenus.length > 0) {
      console.log('菜单有子菜单，无法删除');
      return NextResponse.json(
        { error: '无法删除包含子菜单的菜单。请先删除子菜单或更新它们的父级。' },
        { status: 400 }
      );
    }
    
    // 删除菜单
    await db
      .delete(schema.menus)
      .where(eq(schema.menus.id, id));
    
    console.log('菜单删除成功');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除菜单出错:', error);
    return NextResponse.json(
      { error: '删除菜单失败' },
      { status: 500 }
    );
  }
}
