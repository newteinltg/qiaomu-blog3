import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    // 创建用户表
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 创建分类表
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        description TEXT,
        parentId INTEGER,
        order INTEGER DEFAULT 0 NOT NULL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updatedAt TEXT
      );
    `);

    // 创建文章表
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        content TEXT NOT NULL,
        excerpt TEXT,
        published INTEGER DEFAULT 0,
        pinned INTEGER DEFAULT 0,
        coverImage TEXT,
        pageType TEXT DEFAULT 'markdown' NOT NULL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
        authorId INTEGER REFERENCES users(id),
        categoryId INTEGER REFERENCES categories(id)
      );
    `);

    // 创建标签表
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        slug TEXT NOT NULL,
        description TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);

    // 创建文章标签关联表
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS post_tags (
        post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
        tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
        PRIMARY KEY (post_id, tag_id)
      );
    `);

    // 创建文章分类关联表
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS post_categories (
        postId INTEGER REFERENCES posts(id) ON DELETE CASCADE,
        categoryId INTEGER REFERENCES categories(id) ON DELETE CASCADE,
        PRIMARY KEY (postId, categoryId)
      );
    `);

    // 创建菜单表
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS menus (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        url TEXT,
        is_external INTEGER DEFAULT 0 NOT NULL,
        parent_id INTEGER,
        "order" INTEGER DEFAULT 0 NOT NULL,
        is_active INTEGER DEFAULT 1 NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TEXT
      );
    `);

    // 创建媒体表
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS media (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url TEXT NOT NULL,
        altText TEXT,
        width INTEGER,
        height INTEGER,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 创建站点设置表
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS site_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        site_name TEXT NOT NULL,
        site_description TEXT,
        site_keywords TEXT,
        site_logo TEXT,
        site_favicon TEXT,
        footer_text TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TEXT
      );
    `);

    // 创建社交链接表
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS social_links (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        platform TEXT NOT NULL,
        url TEXT NOT NULL,
        icon TEXT,
        display_name TEXT,
        "order" INTEGER DEFAULT 0 NOT NULL,
        is_active INTEGER DEFAULT 1 NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TEXT
      );
    `);

    // 创建联系信息表
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS contact_info (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        value TEXT NOT NULL,
        display_name TEXT,
        is_public INTEGER DEFAULT 1 NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TEXT
      );
    `);

    // 创建打赏信息表
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS donation_info (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        name TEXT NOT NULL,
        qr_code TEXT NOT NULL,
        description TEXT,
        is_active INTEGER DEFAULT 1 NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TEXT
      );
    `);

    // 创建头部脚本表
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS head_scripts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        code TEXT NOT NULL,
        type TEXT DEFAULT 'analytics' NOT NULL,
        is_active INTEGER DEFAULT 1 NOT NULL,
        position TEXT DEFAULT 'head' NOT NULL,
        pages TEXT,
        "order" INTEGER DEFAULT 0 NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TEXT
      );
    `);

    // 创建英雄区设置表
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS hero_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        subtitle TEXT,
        background_image TEXT,
        is_active INTEGER DEFAULT 1 NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TEXT
      );
    `);

    // 添加默认分类
    const categoriesCount = await db.select({ count: sql`count(*)` }).from(sql`categories`);
    if (categoriesCount[0].count === 0) {
      await db.run(sql`
        INSERT INTO categories (name, slug, description, order)
        VALUES ('未分类', 'uncategorized', '默认分类', 0);
      `);
    }

    // 添加默认站点设置
    const settingsCount = await db.select({ count: sql`count(*)` }).from(sql`site_settings`);
    if (settingsCount[0].count === 0) {
      await db.run(sql`
        INSERT INTO site_settings (site_name, site_description)
        VALUES ('向阳乔木的个人博客', '分享技术、生活和思考');
      `);
    }

    // 添加默认英雄区设置
    const heroCount = await db.select({ count: sql`count(*)` }).from(sql`hero_settings`);
    if (heroCount[0].count === 0) {
      await db.run(sql`
        INSERT INTO hero_settings (title, subtitle)
        VALUES ('向阳而生，静待花开', '分享技术、生活和思考');
      `);
    }

    return NextResponse.json({ 
      success: true, 
      message: '数据库初始化成功' 
    });
  } catch (error) {
    console.error('数据库初始化失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: '数据库初始化失败', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
