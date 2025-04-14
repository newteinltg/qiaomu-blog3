'use server';

import { links, webhooks } from '@/lib/schema/links';
import { eq, desc, sql, and } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import path from 'path';

// 初始化数据库连接
function getDB() {
  try {
    const dbPath = path.join(process.cwd(), 'links.db');
    const sqlite = new Database(dbPath);
    return drizzle(sqlite);
  } catch (error) {
    console.error('Failed to connect to links database:', error);
    throw new Error('数据库连接失败');
  }
}

// 获取所有链接
export async function getLinks(tag?: string | null, page: number = 1, pageSize: number = 20, includeHidden: boolean = false) {
  try {
    const db = getDB();

    const offset = (page - 1) * pageSize;

    // 构建查询条件
    let conditions = [];

    // 如果有标签参数，过滤包含该标签的链接
    if (tag) {
      // 处理JSON格式的标签和逗号分隔的标签
      conditions.push(sql`(
        tags LIKE '%' || ${tag} || '%' OR
        tags LIKE '%"value":"' || ${tag} || '"%'
      )`);
    }

    // 除非显式要求包含隐藏链接，否则只显示可见的链接
    if (!includeHidden) {
      conditions.push(eq(links.isVisible, 1));
    }

    // 执行查询
    const results = await db.select()
      .from(links)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(pageSize)
      .offset(offset)
      .orderBy(desc(links.createdAt));

    // 获取总数
    const totalCount = await db.select({ count: sql`count(*)` })
      .from(links)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return {
      links: results,
      pagination: {
        total: Number(totalCount[0]?.count || 0),
        page,
        pageSize,
        totalPages: Math.ceil(Number(totalCount[0]?.count || 0) / pageSize)
      }
    };
  } catch (error) {
    console.error('获取链接列表失败:', error);
    throw error;
  }
}

// 获取单个链接
export async function getLink(id: number) {
  try {
    const db = getDB();

    if (isNaN(id)) {
      throw new Error('无效的链接ID');
    }

    const link = await db.select().from(links).where(eq(links.id, id)).limit(1);

    if (!link || link.length === 0) {
      throw new Error('链接不存在');
    }

    return link[0];
  } catch (error) {
    console.error('获取链接失败:', error);
    throw error;
  }
}

// 创建或更新链接
export async function createLink(data: any) {
  try {
    const db = getDB();

    // 验证必填字段
    if (!data.title || !data.url) {
      throw new Error('标题和URL为必填项');
    }

    // 检查URL是否已存在
    const existingLink = await db.select().from(links).where(eq(links.url, data.url)).limit(1);

    let result;
    const currentTime = new Date().toISOString();

    if (existingLink && existingLink.length > 0) {
      // URL已存在，更新现有记录
      result = await db.update(links)
        .set({
          title: data.title,
          description: data.description || existingLink[0].description,
          coverImage: data.coverImage || existingLink[0].coverImage,
          tags: data.tags || existingLink[0].tags,
          isVisible: data.isVisible !== undefined ? data.isVisible : existingLink[0].isVisible,
          updatedAt: currentTime
        })
        .where(eq(links.id, existingLink[0].id))
        .returning();

      // 触发Webhook
      if (result && result.length > 0) {
        triggerWebhooks('update', result[0]);
      }
    } else {
      // URL不存在，创建新记录
      result = await db.insert(links).values({
        title: data.title,
        url: data.url,
        description: data.description || null,
        coverImage: data.coverImage || null,
        tags: data.tags || null,
        isVisible: data.isVisible !== undefined ? data.isVisible : 1, // 默认可见
        createdAt: currentTime,
        updatedAt: currentTime
      }).returning();

      // 触发Webhook
      if (result && result.length > 0) {
        triggerWebhooks('create', result[0]);
      }
    }

    return result[0];
  } catch (error) {
    console.error('创建链接失败:', error);
    throw error;
  }
}

// 更新链接
export async function updateLink(id: number, data: any) {
  try {
    const db = getDB();

    if (isNaN(id)) {
      throw new Error('无效的链接ID');
    }

    // 验证必填字段
    if (!data.title || !data.url) {
      throw new Error('标题和URL为必填项');
    }

    // 检查链接是否存在
    const existingLink = await db.select().from(links).where(eq(links.id, id)).limit(1);

    if (!existingLink || existingLink.length === 0) {
      throw new Error('链接不存在');
    }

    // 更新链接
    const result = await db.update(links)
      .set({
        title: data.title,
        url: data.url,
        description: data.description || null,
        coverImage: data.coverImage || null,
        tags: data.tags || null,
        isVisible: data.isVisible !== undefined ? data.isVisible : existingLink[0].isVisible,
        updatedAt: new Date().toISOString()
      })
      .where(eq(links.id, id))
      .returning();

    // 触发Webhook
    if (result && result.length > 0) {
      triggerWebhooks('update', result[0]);
    }

    return result[0];
  } catch (error) {
    console.error('更新链接失败:', error);
    throw error;
  }
}

// 切换链接可见性
export async function toggleLinkVisibility(id: number) {
  try {
    const db = getDB();

    if (isNaN(id)) {
      throw new Error('无效的链接ID');
    }

    // 检查链接是否存在
    const existingLink = await db.select().from(links).where(eq(links.id, id)).limit(1);

    if (!existingLink || existingLink.length === 0) {
      throw new Error('链接不存在');
    }

    // 切换可见性（从1变为0，或从0变为1）
    const newVisibility = existingLink[0].isVisible === 1 ? 0 : 1;

    // 更新链接
    const result = await db.update(links)
      .set({
        isVisible: newVisibility,
        updatedAt: new Date().toISOString()
      })
      .where(eq(links.id, id))
      .returning();

    // 触发Webhook
    if (result && result.length > 0) {
      triggerWebhooks('update', result[0]);
    }

    return result[0];
  } catch (error) {
    console.error('切换链接可见性失败:', error);
    throw error;
  }
}

// 删除链接
export async function deleteLink(id: number) {
  try {
    const db = getDB();

    if (isNaN(id)) {
      throw new Error('无效的链接ID');
    }

    // 获取要删除的链接信息（用于Webhook）
    const linkToDelete = await db.select().from(links).where(eq(links.id, id)).limit(1);

    if (!linkToDelete || linkToDelete.length === 0) {
      throw new Error('链接不存在');
    }

    // 删除链接
    await db.delete(links).where(eq(links.id, id));

    // 触发Webhook
    triggerWebhooks('delete', linkToDelete[0]);

    return { success: true };
  } catch (error) {
    console.error('删除链接失败:', error);
    throw error;
  }
}

// 触发Webhook
async function triggerWebhooks(action: string, data: any) {
  try {
    const db = getDB();

    // 获取所有活跃的Webhook
    const activeWebhooks = await db.select().from(webhooks).where(eq(webhooks.isActive, 1));

    // 并行触发所有Webhook
    const promises = activeWebhooks.map(async (webhook) => {
      try {
        const payload = {
          action,
          data,
          timestamp: new Date().toISOString()
        };

        // 发送POST请求到Webhook URL
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': webhook.secret ? createSignature(payload, webhook.secret) : ''
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          console.error(`Webhook触发失败: ${webhook.url}, 状态码: ${response.status}`);
        }
      } catch (error) {
        console.error(`Webhook触发出错: ${webhook.url}`, error);
      }
    });

    await Promise.allSettled(promises);
  } catch (error) {
    console.error('触发Webhook失败:', error);
  }
}

// 创建签名
function createSignature(payload: any, secret: string): string {
  const crypto = require('crypto');
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  return hmac.digest('hex');
}
