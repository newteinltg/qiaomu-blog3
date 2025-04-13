import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/schema';
import { eq, like, sql } from 'drizzle-orm';
import { generateSlug } from '@/lib/utils';

// GET 获取所有标签
export async function GET(request: Request) {
  try {
    console.log('开始处理获取标签请求');
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '25');
    
    // 计算偏移量
    const offset = (page - 1) * pageSize;
    
    // 获取总记录数
    const countResult = await db.select({ 
      count: sql<number>`count(*)` 
    }).from(schema.tags);
    const totalCount = countResult[0].count;
    
    let tagsData;
    
    if (search) {
      // 使用原始SQL查询来避免类型错误
      tagsData = await db.query.tags.findMany({
        where: like(schema.tags.name, `%${search}%`),
        orderBy: [schema.tags.name],
        limit: pageSize,
        offset: offset
      });
    } else {
      // 使用查询构建器的findMany方法
      tagsData = await db.query.tags.findMany({
        orderBy: [schema.tags.name],
        limit: pageSize,
        offset: offset
      });
    }
    
    console.log(`成功获取到 ${tagsData.length} 个标签，总数: ${totalCount}`);
    
    // 确保字段名称一致性
    const formattedTags = tagsData.map(tag => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      description: tag.description,
      createdAt: tag.createdAt
    }));
    
    // 计算总页数
    const totalPages = Math.ceil(totalCount / pageSize);
    
    // 返回同时兼容新旧格式的数据
    return NextResponse.json({
      data: formattedTags, // 旧格式使用 data
      tags: formattedTags,  // 新格式使用 tags
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages
      }
    });
  } catch (error) {
    console.error('获取标签时出错:', error);
    return NextResponse.json(
      { error: '获取标签失败' },
      { status: 500 }
    );
  }
}

// POST 创建新标签
export async function POST(request: Request) {
  try {
    console.log('开始处理创建标签请求');
    const { name, slug, description } = await request.json();
    
    if (!name) {
      console.log('创建标签失败: 标签名称为空');
      return NextResponse.json(
        { error: '标签名称不能为空' },
        { status: 400 }
      );
    }
    
    // 检查标签名是否已存在
    const existingTag = await db.query.tags.findFirst({
      where: eq(schema.tags.name, name)
    });
    
    if (existingTag) {
      console.log('创建标签失败: 标签名已存在', name);
      return NextResponse.json(
        { error: '标签名已存在' },
        { status: 400 }
      );
    }
    
    // 生成 slug 或使用提供的 slug
    const finalSlug = slug || generateSlug(name);
    
    // 插入新标签
    const result = await db.insert(schema.tags).values({
      name,
      slug: finalSlug,
      description: description || null,
      createdAt: new Date().toISOString() // 使用 schema 中定义的字段名
    });
    
    console.log('标签创建成功:', name, finalSlug);
    
    return NextResponse.json({ 
      success: true,
      id: result.lastInsertRowid
    });
  } catch (error) {
    console.error('创建标签时出错:', error);
    return NextResponse.json(
      { error: '创建标签失败' },
      { status: 500 }
    );
  }
}
