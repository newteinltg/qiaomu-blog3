import { db } from '@/lib/db';
import * as schema from '@/lib/schema';
import { eq, isNull, asc, count, and } from 'drizzle-orm';

// 获取网站基本设置
export async function getSiteSettings() {
  // 添加时间戳参数，确保每次都获取最新数据
  const timestamp = Date.now();
  
  const settings = await db
    .select()
    .from(schema.siteSettings);

  // 将设置转换为键值对对象
  return settings.reduce((acc, setting) => {
    if (setting && setting.key) {
      acc[setting.key] = setting.value;
    }
    return acc;
  }, {} as Record<string, string | null>);
}

// 获取社交媒体链接
export async function getSocialLinks() {
  // 添加时间戳参数，确保每次都获取最新数据
  const timestamp = Date.now();
  
  return db
    .select()
    .from(schema.socialLinks)
    .where(eq(schema.socialLinks.isActive, 1))
    .orderBy(schema.socialLinks.order);
}

// 获取联系方式
export async function getContactInfo() {
  // 添加时间戳参数，确保每次都获取最新数据
  const timestamp = Date.now();
  
  return db
    .select()
    .from(schema.contactInfo)
    .where(eq(schema.contactInfo.isActive, 1));
}

// 获取打赏信息
export async function getDonationInfo() {
  // 添加时间戳参数，确保每次都获取最新数据
  const timestamp = Date.now();
  
  return db
    .select()
    .from(schema.donationInfo)
    .where(eq(schema.donationInfo.isActive, 1));
}

// 获取Hero区域设置
export async function getHeroSettings() {
  // 添加时间戳参数，确保每次都获取最新数据
  const timestamp = Date.now();
  
  const heroSettings = await db
    .select()
    .from(schema.heroSettings)
    .where(eq(schema.heroSettings.isActive, 1))
    .limit(1)
    .all();

  return heroSettings[0] || null;
}

// 获取菜单
export async function getMenus(parentId?: number | null) {
  try {
    if (parentId === undefined) {
      // 获取所有菜单
      return db
        .select()
        .from(schema.menus)
        .where(eq(schema.menus.isActive, 1))
        .orderBy(asc(schema.menus.parentId), asc(schema.menus.order))
        .all();
    } else if (parentId === null) {
      // 获取顶级菜单
      return db
        .select()
        .from(schema.menus)
        .where(and(
          eq(schema.menus.isActive, 1),
          isNull(schema.menus.parentId)
        ))
        .orderBy(asc(schema.menus.order))
        .all();
    } else {
      // 获取特定父级下的子菜单
      return db
        .select()
        .from(schema.menus)
        .where(and(
          eq(schema.menus.isActive, 1),
          eq(schema.menus.parentId, parentId)
        ))
        .orderBy(asc(schema.menus.order))
        .all();
    }
  } catch (error) {
    console.error('获取菜单失败:', error);
    return [];
  }
}

// 获取分类
export async function getCategories() {
  try {
    // 先获取所有分类
    const allCategories = await db
      .select({
        id: schema.categories.id,
        name: schema.categories.name,
        slug: schema.categories.slug,
        description: schema.categories.description,
        parentId: schema.categories.parentId,
        order: schema.categories.order,
      })
      .from(schema.categories)
      .orderBy(asc(schema.categories.order))
      .all();

    if (!allCategories || !Array.isArray(allCategories)) {
      return [];
    }

    if (!allCategories || !Array.isArray(allCategories) || allCategories.length === 0) {
      return [];
    }

  if (!allCategories || allCategories.length === 0) {
    return [];
  }

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

  if (!categoryCounts || !Array.isArray(categoryCounts)) {
    return allCategories.map(category => ({
      ...category,
      postCount: 0
    }));
  }

  // 创建分类ID到文章数量的映射
  const countMap = new Map();
  if (categoryCounts && Array.isArray(categoryCounts)) {
    categoryCounts.forEach(item => {
      if (item && item.categoryId && item.postCount !== undefined) {
        countMap.set(item.categoryId, item.postCount);
      }
    });
  }

  // 为每个分类添加文章数量
  const categoriesWithCounts = allCategories.map(category => ({
    ...category,
    postCount: countMap.get(category.id) || 0
  }));

  // 过滤出有已发布文章的分类
  return categoriesWithCounts?.filter(category => 
    category && 
    typeof category.postCount === 'number' && 
    category.postCount > 0
  ) || [];
  } catch (error) {
    console.error('获取分类时出错:', error);
    return [];
  }
}

// 获取标签
export async function getTags() {
  // 先获取所有标签
  const allTags = await db
    .select({
      id: schema.tags.id,
      name: schema.tags.name,
      slug: schema.tags.slug,
      description: schema.tags.description,
      createdAt: schema.tags.createdAt,
      postCount: count(schema.postTags.postId)
    })
    .from(schema.tags)
    .leftJoin(schema.postTags, eq(schema.tags.id, schema.postTags.tagId))
    .leftJoin(schema.posts, eq(schema.postTags.postId, schema.posts.id))
    .where(eq(schema.posts.published, 1)) // 只计算已发布的文章
    .groupBy(schema.tags.id)
    .orderBy(schema.tags.name)
    .all();

  // 过滤出有已发布文章的标签
  return allTags.filter(tag => tag.postCount > 0);
}

// 获取所有设置（综合）
export async function getAllSettings() {
  // 添加时间戳参数，确保每次都获取最新数据
  const timestamp = Date.now();
  
  return db
    .select()
    .from(schema.siteSettings)
    .all();
}
