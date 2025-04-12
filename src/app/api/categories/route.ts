import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/schema';
import { eq, sql, count } from 'drizzle-orm';

// 获取所有分类
export async function GET(request: NextRequest) {
  try {
    console.log('获取分类列表');

    // 检查是否有 id 参数，如果有则转发到单个分类的 API
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      console.log(`请求单个分类: ${id}, 但应该使用 /api/categories/${id} 路径`);
      return NextResponse.json(
        { error: `请使用 /api/categories/${id} 获取单个分类` },
        { status: 400 }
      );
    }

    // 先获取所有分类
    const allCategories = await db
      .select({
        id: schema.categories.id,
        name: schema.categories.name,
        slug: schema.categories.slug,
        description: schema.categories.description,
        parentId: schema.categories.parentId,
        order: schema.categories.order,
        createdAt: schema.categories.createdAt,
        updatedAt: schema.categories.updatedAt
      })
      .from(schema.categories)
      .orderBy(schema.categories.order)
      .all();

    // 获取每个分类的已发布文章数量
    const categoryCounts = await db
      .select({
        categoryId: schema.postCategories.categoryId,
        postCount: count(schema.postCategories.postId)
      })
      .from(schema.postCategories)
      .innerJoin(schema.posts, eq(schema.postCategories.postId, schema.posts.id))
      .where(eq(schema.posts.published, 1)) // 只计算已发布的文章
      .groupBy(schema.postCategories.categoryId)
      .all();

    // 创建分类ID到文章数量的映射
    const countMap = new Map();
    categoryCounts.forEach(item => {
      countMap.set(item.categoryId, item.postCount);
    });

    // 为每个分类添加文章数量
    const categoriesWithCounts = allCategories.map(category => ({
      ...category,
      postCount: countMap.get(category.id) || 0
    }));

    // 检查是否来自管理页面的请求
    const referer = request.headers.get('referer') || '';
    const isAdminRequest = referer.includes('/admin/');

    // 如果是管理页面的请求，返回所有分类；否则只返回有已发布文章的分类
    if (isAdminRequest) {
      console.log(`成功获取 ${allCategories.length} 个分类（管理页面请求）`);
      return NextResponse.json(categoriesWithCounts);
    } else {
      // 前台页面只显示有已发布文章的分类
      const filteredCategories = categoriesWithCounts.filter(category => category.postCount > 0);
      console.log(`成功获取 ${allCategories.length} 个分类，其中 ${filteredCategories.length} 个有已发布文章（前台页面请求）`);
      return NextResponse.json(filteredCategories);
    }
  } catch (error) {
    console.error('获取分类列表失败:', error);
    return NextResponse.json(
      { error: '获取分类列表失败' },
      { status: 500 }
    );
  }
}

// 创建新分类
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 验证必填字段
    if (!body.name || !body.slug) {
      return NextResponse.json(
        { error: '分类名称和别名是必填项' },
        { status: 400 }
      );
    }

    console.log('创建新分类:', body.name);

    // 计算新分类的排序值
    let maxOrder = 0;
    if (body.parentId) {
      // 如果有父分类，获取同级分类的最大排序值
      const siblingCategories = await db.select({ order: schema.categories.order })
        .from(schema.categories)
        .where(eq(schema.categories.parentId, body.parentId))
        .orderBy(schema.categories.order);

      if (siblingCategories.length > 0) {
        maxOrder = siblingCategories[siblingCategories.length - 1].order;
      }
    } else {
      // 获取顶级分类的最大排序值
      const rootCategories = await db.select({ order: schema.categories.order })
        .from(schema.categories)
        .where(sql`${schema.categories.parentId} IS NULL`)
        .orderBy(schema.categories.order);

      if (rootCategories.length > 0) {
        maxOrder = rootCategories[rootCategories.length - 1].order;
      }
    }

    // 创建新分类，排序值加10
    const newCategory = await db.insert(schema.categories).values({
      name: body.name,
      slug: body.slug,
      description: body.description || null,
      parentId: body.parentId || null,
      order: maxOrder + 10,
      createdAt: new Date().toISOString(),
    }).returning();

    console.log('分类创建成功:', newCategory[0].id);

    return NextResponse.json(newCategory[0]);
  } catch (error) {
    console.error('创建分类失败:', error);
    return NextResponse.json(
      { error: '创建分类失败' },
      { status: 500 }
    );
  }
}

// 更新分类
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // 验证必填字段
    if (!body.id || !body.name || !body.slug) {
      return NextResponse.json(
        { error: '分类ID、名称和别名是必填项' },
        { status: 400 }
      );
    }

    console.log('更新分类:', body.id);

    // 检查是否将分类设为自己的子分类（避免循环引用）
    if (body.parentId === body.id) {
      return NextResponse.json(
        { error: '分类不能成为自己的子分类' },
        { status: 400 }
      );
    }

    // 更新分类
    const updatedCategory = await db.update(schema.categories)
      .set({
        name: body.name,
        slug: body.slug,
        description: body.description || null,
        parentId: body.parentId || null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.categories.id, body.id))
      .returning();

    if (updatedCategory.length === 0) {
      return NextResponse.json(
        { error: '分类不存在' },
        { status: 404 }
      );
    }

    console.log('分类更新成功');

    return NextResponse.json(updatedCategory[0]);
  } catch (error) {
    console.error('更新分类失败:', error);
    return NextResponse.json(
      { error: '更新分类失败' },
      { status: 500 }
    );
  }
}

// 删除分类
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: '分类ID是必填项' },
        { status: 400 }
      );
    }

    console.log('删除分类:', id);

    // 检查分类是否存在
    const existingCategory = await db.select()
      .from(schema.categories)
      .where(eq(schema.categories.id, parseInt(id)))
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
        .where(eq(schema.posts.categoryId, parseInt(id)));

      // 处理子分类，将它们变为顶级分类
      await tx
        .update(schema.categories)
        .set({ parentId: null })
        .where(eq(schema.categories.parentId, parseInt(id)));

      // 删除分类
      await tx
        .delete(schema.categories)
        .where(eq(schema.categories.id, parseInt(id)));

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

// 批量更新分类排序
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    if (!Array.isArray(body) || body.length === 0) {
      return NextResponse.json(
        { error: '请提供有效的分类排序数据' },
        { status: 400 }
      );
    }

    console.log('更新分类排序:', body.length, '个分类');

    // 使用事务批量更新
    const updatedCategories = await db.transaction(async (tx) => {
      const results = [];

      for (const item of body) {
        if (!item.id) continue;

        const result = await tx.update(schema.categories)
          .set({
            order: item.order,
            parentId: item.parentId,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(schema.categories.id, item.id))
          .returning();

        if (result.length > 0) {
          results.push(result[0]);
        }
      }

      return results;
    });

    console.log('分类排序更新成功:', updatedCategories.length, '个分类');

    // 获取最新的分类列表
    const allCategories = await db.select().from(schema.categories).orderBy(schema.categories.order);

    return NextResponse.json(allCategories);
  } catch (error) {
    console.error('更新分类排序失败:', error);
    return NextResponse.json(
      { error: '更新分类排序失败' },
      { status: 500 }
    );
  }
}
