import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/schema';
import { eq, asc, desc, isNull, sql } from 'drizzle-orm';

// GET 获取所有菜单
export async function GET(request: Request) {
  try {
    console.log('开始获取菜单列表');
    
    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get('parentId');
    const includeInactive = searchParams.get('includeInactive') === 'true';
    
    console.log('查询参数:', { parentId, includeInactive });
    
    // 使用标准 Drizzle ORM 查询
    let menus;
    
    if (parentId === 'null') {
      console.log('筛选顶级菜单');
      menus = await db.select()
        .from(schema.menus)
        .where(isNull(schema.menus.parentId))
        .orderBy(asc(schema.menus.order));
    } else if (parentId) {
      console.log('筛选子菜单, parentId:', parentId);
      menus = await db.select()
        .from(schema.menus)
        .where(eq(schema.menus.parentId, parseInt(parentId)))
        .orderBy(asc(schema.menus.order));
    } else {
      // 获取所有菜单
      menus = await db.select()
        .from(schema.menus)
        .orderBy(asc(schema.menus.parentId), asc(schema.menus.order));
    }
    
    // 如果需要过滤非激活菜单
    if (!includeInactive) {
      console.log('过滤非激活菜单');
      menus = menus.filter(menu => menu.isActive);
    }
    
    console.log(`获取到 ${menus.length} 个菜单`);
    
    return NextResponse.json(menus);
  } catch (error) {
    console.error('获取菜单列表出错:', error);
    return NextResponse.json(
      { error: '获取菜单列表失败' },
      { status: 500 }
    );
  }
}

// POST 创建新菜单
export async function POST(request: Request) {
  try {
    const { name, description, url, isExternal, parentId, order, isActive } = await request.json();
    
    console.log('创建菜单请求数据:', { name, description, url, isExternal, parentId, order, isActive });
    
    // 验证必填字段
    if (!name || name.trim() === '') {
      console.log('菜单名称为空');
      return NextResponse.json(
        { error: '菜单名称不能为空' },
        { status: 400 }
      );
    }
    
    // 检查父级菜单是否存在
    if (parentId !== null && parentId !== undefined) {
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
      const visited = new Set([parentId]);
      
      while (currentParentId !== null) {
        if (visited.has(currentParentId)) {
          return NextResponse.json(
            { error: '检测到循环引用，无法创建菜单' },
            { status: 400 }
          );
        }
        
        visited.add(currentParentId);
        
        const currentParent = await db.select()
          .from(schema.menus)
          .where(eq(schema.menus.id, currentParentId))
          .limit(1)
          .then(results => results[0] || null);
        
        if (!currentParent) break;
        currentParentId = currentParent.parentId;
      }
    }
    
    // 获取最大排序值
    let maxOrder = 0;
    if (parentId === null || parentId === undefined) {
      const result = await db.select({
        maxOrder: schema.menus.order
      })
      .from(schema.menus)
      .where(isNull(schema.menus.parentId))
      .orderBy(desc(schema.menus.order))
      .limit(1)
      .then(results => results[0]);
      
      maxOrder = result?.maxOrder || 0;
    } else {
      const result = await db.select({
        maxOrder: schema.menus.order
      })
      .from(schema.menus)
      .where(eq(schema.menus.parentId, parentId))
      .orderBy(desc(schema.menus.order))
      .limit(1)
      .then(results => results[0]);
      
      maxOrder = result?.maxOrder || 0;
    }
    
    // 构建菜单数据
    const menuData = {
      name: name.trim(),
      description: description?.trim() || null,
      url: url?.trim() || null,
      isExternal: isExternal ? 1 : 0, // 将布尔值转换为 0/1
      parentId: parentId || null,
      order: order !== undefined ? order : maxOrder + 10,
      isActive: isActive ? 1 : 0, // 将布尔值转换为 0/1
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log('准备插入菜单数据:', menuData);
    
    // 插入数据并返回新创建的菜单
    const newMenu = await db.insert(schema.menus)
      .values(menuData)
      .returning();
    
    console.log('新创建的菜单:', newMenu[0]);
    
    return NextResponse.json({ 
      success: true,
      menu: newMenu[0]
    });
  } catch (error) {
    console.error('创建菜单出错:', error);
    return NextResponse.json(
      { error: '创建菜单失败' },
      { status: 500 }
    );
  }
}
