import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
// import { migrate } from 'drizzle-orm/better-sqlite3/migrator'; // 通常不在每次应用启动时运行迁移，尤其是在 Vercel 无服务器环境中。
import { sql, eq } from 'drizzle-orm';
import * as schema from './schema'; // 假设你的 Drizzle schema 定义在这里
import path from 'path';
import fs from 'fs';

console.log('数据库模块初始化开始');

// --- 数据库文件路径和存在性检查 ---
const isVercel = process.env.VERCEL === '1';
const dbPath = path.resolve(process.cwd(), './demo.db'); // 确保和迁移脚本使用的路径一致
const dbExists = fs.existsSync(dbPath);
console.log('数据库文件路径:', dbPath);
console.log('数据库文件是否存在:', dbExists);
console.log('是否在Vercel环境:', isVercel);

// --- 初始化 SQLite 数据库连接 ---
let sqlite: Database.Database;
try {
  // better-sqlite3 会在文件不存在时自动创建它
  sqlite = new Database(dbPath, { verbose: console.log }); // 可以移除 verbose 以减少日志
  console.log('SQLite 数据库连接成功');
} catch (error) {
  console.error('SQLite 数据库连接失败:', error);
  throw error;
}

// --- 创建表函数 (包含所有迁移后的最终结构) ---
const createTables = () => {
  // 只有在数据库文件 *第一次* 被创建时（即 dbExists 为 false 时）才执行 CREATE
  // 或者更健壮的方式是，依赖 CREATE TABLE IF NOT EXISTS
  // if (dbExists) {
  //   console.log('数据库已存在，跳过显式表创建（依赖 IF NOT EXISTS）');
  //   return; // 理论上不需要返回，让 IF NOT EXISTS 处理
  // }

  console.log('开始确保数据库表结构最新...');
  try {
    // --- Users Table (无变化) ---
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // --- Categories Table (合并 migrate.ts/update-categories.ts 的修改) ---
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        description TEXT,
        parent_id INTEGER REFERENCES categories(id), -- 来自迁移脚本
        "order" INTEGER NOT NULL DEFAULT 0,        -- 来自迁移脚本
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, -- 原始就有
        updated_at TEXT                                -- 来自迁移脚本
      );
    `);

    // --- Posts Table (合并 migrate.ts 的 categoryId 和之前错误提示的 coverImage) ---
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        content TEXT NOT NULL,
        excerpt TEXT,
        coverImage TEXT,                              -- 根据之前的错误添加
        published INTEGER DEFAULT 0,
        pinned INTEGER DEFAULT 0,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,     -- 注意：可能需要触发器来自动更新
        authorId INTEGER REFERENCES users(id),
        categoryId INTEGER REFERENCES categories(id)  -- 来自迁移脚本
      );
    `);

    // --- Tags Table (结构与 update-tags.ts 最终期望一致) ---
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        slug TEXT NOT NULL, -- 确保 NOT NULL
        description TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP -- 确保和迁移脚本一致
      );
    `);

    // --- Post Tags Table (无变化) ---
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS post_tags (
        post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
        tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
        PRIMARY KEY (post_id, tag_id)
      );
    `);

    // --- Post Categories Table (无变化) ---
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS post_categories (
        postId INTEGER REFERENCES posts(id),
        categoryId INTEGER REFERENCES categories(id),
        PRIMARY KEY (postId, categoryId)
      );
    `);

    // --- Menus Table (合并 add-menus-table.ts 的修改，添加 FOREIGN KEY) ---
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS menus (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        url TEXT,
        is_external INTEGER DEFAULT 0 NOT NULL,
        parent_id INTEGER, -- 外键约束在后面添加
        sort_order INTEGER DEFAULT 0 NOT NULL, -- 迁移中用了 "order"，这里用 sort_order，保持一致
        is_active INTEGER DEFAULT 1 NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TEXT,
        FOREIGN KEY (parent_id) REFERENCES menus(id) ON DELETE SET NULL -- 添加外键约束，考虑级联操作
      );
    `);

    // --- Media Table (无变化) ---
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS media (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url TEXT NOT NULL,
        altText TEXT,
        width INTEGER,
        height INTEGER,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // --- Site Settings Table (无变化) ---
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS site_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT,
        setting_group TEXT NOT NULL DEFAULT 'general',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TEXT
      );
    `);

    // --- Social Links Table (无变化) ---
    sqlite.exec(`
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

    // --- Contact Info Table (无变化) ---
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS contact_info (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        value TEXT NOT NULL,
        qr_code_url TEXT,
        display_name TEXT,
        is_active INTEGER DEFAULT 1 NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TEXT
      );
    `);

    // --- Donation Info Table (无变化) ---
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS donation_info (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        qr_code_url TEXT NOT NULL,
        description TEXT,
        is_active INTEGER DEFAULT 1 NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TEXT
      );
    `);

    // --- Hero Settings Table (无变化) ---
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS hero_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        subtitle TEXT,
        background_image_url TEXT,
        button_text TEXT,
        button_url TEXT,
        is_active INTEGER DEFAULT 1 NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TEXT
      );
    `);

    console.log('数据库表结构检查/创建完成');
  } catch (error) {
    console.error('确保数据库表结构最新时出错:', error);
    throw error;
  }
};

// --- 运行创建/检查表结构 ---
try {
  createTables();

  // --- 添加种子数据 (Seed Data) - 逻辑保持不变 ---
  // 检查数据库是否有数据，如果没有则添加一些测试数据
  // （使用 try-catch 包裹每个插入，以防表结构暂时不匹配或其他约束问题）

  try {
    const tagCountResult = sqlite.prepare('SELECT COUNT(*) as count FROM tags').get();
    const tagCount = tagCountResult ? (tagCountResult as { count: number }).count : 0;
    if (tagCount === 0) {
      console.log('添加测试标签数据...');
      // 注意: update-tags.ts 中为 slug 添加了 NOT NULL 约束，确保插入时提供 slug
      // 使用原始初始化文件中的数据，但确保 slug 存在
       sqlite.exec(`
        INSERT INTO tags (name, slug, description, created_at) VALUES
        ('JavaScript', 'javascript', 'JavaScript编程语言相关文章', CURRENT_TIMESTAMP),
        ('React', 'react', 'React框架相关文章', CURRENT_TIMESTAMP),
        ('Next.js', 'nextjs', 'Next.js框架相关文章', CURRENT_TIMESTAMP);
      `);
      // 你也可以使用 update-tags.ts 中的示例数据
      // sqlite.exec(`...`);
    }
  } catch (error) {
      console.error('检查或添加标签数据失败:', error);
  }

  try {
    const postCountResult = sqlite.prepare('SELECT COUNT(*) as count FROM posts').get();
    const postCount = postCountResult ? (postCountResult as { count: number }).count : 0;
    if (postCount === 0) {
      console.log('添加测试文章数据...');
      // 注意：posts 表现在有 categoryId, 但测试数据没有提供，可能需要设置默认值或允许 NULL
      // 如果 categoryId 是 NOT NULL 且没有默认值，这里会失败
      // 假设 categoryId 可以为 NULL 或有默认值
      sqlite.exec(`
        INSERT INTO posts (title, slug, content, excerpt, published, createdAt, updatedAt) VALUES
        ('第一篇博客文章', 'first-post', '这是第一篇博客文章的内容。', '这是摘要', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('第二篇博客文章', 'second-post', '这是第二篇博客文章的内容。', '这是摘要', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('草稿文章', 'draft-post', '这是一篇草稿文章。', '这是摘要', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
      `);
    }
  } catch (error) {
      console.error('检查或添加文章数据失败:', error);
  }

  try {
    const menuCountResult = sqlite.prepare('SELECT COUNT(*) as count FROM menus').get();
    const menuCount = menuCountResult ? (menuCountResult as { count: number }).count : 0;
    if (menuCount === 0) {
      console.log('添加测试菜单数据...');
      // `order` 列在迁移中是 `sort_order`，在 CREATE TABLE 中用了 `sort_order`，保持一致
      sqlite.exec(`
        INSERT INTO menus (name, description, url, is_external, parent_id, sort_order, is_active, created_at) VALUES
        ('首页', '网站首页', '/', 0, NULL, 0, 1, CURRENT_TIMESTAMP),
        ('博客', '博客文章列表', '/blog', 0, NULL, 10, 1, CURRENT_TIMESTAMP),
        ('关于', '关于页面', '/about', 0, NULL, 20, 1, CURRENT_TIMESTAMP),
        ('GitHub', 'GitHub主页', 'https://github.com', 1, NULL, 30, 1, CURRENT_TIMESTAMP);
      `);
    }
  } catch (error) {
      console.error('检查或添加菜单数据失败:', error);
  }

  try {
    const categoryCountResult = sqlite.prepare('SELECT COUNT(*) as count FROM categories').get();
    const categoryCount = categoryCountResult ? (categoryCountResult as { count: number }).count : 0;
    if (categoryCount === 0) {
      console.log('添加默认分类数据...');
      // 注意：categories 表现在有 parent_id, order, updated_at 列
      sqlite.exec(`
        INSERT INTO categories (name, slug, description, created_at) VALUES
        ('未分类', 'uncategorized', '默认分类', CURRENT_TIMESTAMP),
        ('技术', 'technology', '技术相关文章', CURRENT_TIMESTAMP),
        ('生活', 'life', '生活相关文章', CURRENT_TIMESTAMP);
      `);
    }
  } catch (error) {
    console.error('检查或添加默认分类失败:', error);
  }

  // ... (其他种子数据的插入逻辑保持类似，用 try-catch 包裹) ...
  try {
    const settingsCountResult = sqlite.prepare('SELECT COUNT(*) as count FROM site_settings').get();
    const settingsCount = settingsCountResult ? (settingsCountResult as { count: number }).count : 0;
    if (settingsCount === 0) {
      console.log('添加默认网站设置数据...');
      sqlite.exec(`
        INSERT INTO site_settings (key, value, setting_group) VALUES
        ('title', '向阳乔木的个人博客', 'general'),
        ('description', '分享技术、生活和思考，记录成长的点滴。', 'general'),
        ('logo', '/images/logo.png', 'general'),
        ('favicon', '/favicon.ico', 'general'),
        ('copyright', ' 2025 向阳乔木的个人博客. All rights reserved.', 'general');
      `);
    }
  } catch (error) {
    console.error('检查或添加默认网站设置失败:', error);
  }

  try {
    const socialCountResult = sqlite.prepare('SELECT COUNT(*) as count FROM social_links').get();
    const socialCount = socialCountResult ? (socialCountResult as { count: number }).count : 0;
    if (socialCount === 0) {
      console.log('添加默认社交媒体链接数据...');
      // 注意："order" 是 SQLite 关键字，需要引号
      sqlite.exec(`
        INSERT INTO social_links (platform, url, icon, display_name, "order") VALUES
        ('github', 'https://github.com', 'github', 'GitHub', 0),
        ('twitter', 'https://twitter.com', 'twitter', 'Twitter', 1),
        ('weibo', 'https://weibo.com', 'weibo', '微博', 2);
      `);
    }
  } catch (error) {
    console.error('检查或添加默认社交媒体链接失败:', error);
  }

  try {
    const contactCountResult = sqlite.prepare('SELECT COUNT(*) as count FROM contact_info').get();
    const contactCount = contactCountResult ? (contactCountResult as { count: number }).count : 0;
    if (contactCount === 0) {
      console.log('添加默认联系方式数据...');
      sqlite.exec(`
        INSERT INTO contact_info (type, value, display_name) VALUES
        ('email', 'example@example.com', '邮箱'),
        ('wechat', 'wechat_id', '微信');
      `);
    }
  } catch (error) {
    console.error('检查或添加默认联系方式失败:', error);
  }

   try {
    const heroCountResult = sqlite.prepare('SELECT COUNT(*) as count FROM hero_settings').get();
    const heroCount = heroCountResult ? (heroCountResult as { count: number }).count : 0;
    if (heroCount === 0) {
      console.log('添加默认Hero区域设置数据...');
      sqlite.exec(`
        INSERT INTO hero_settings (title, subtitle, background_image_url, button_text, button_url) VALUES
        ('向阳乔木的个人博客', '分享技术、生活和思考', '/images/hero-bg.jpg', '了解更多', '/about');
      `);
    }
  } catch (error) {
    console.error('检查或添加默认Hero区域设置失败:', error);
  }


  console.log('数据库初始化/种子数据检查完成');
} catch (error) {
  console.error('数据库初始化或种子数据添加过程中出错:', error);
  // 在这里可能不需要重新抛出，让应用继续尝试运行，
  // 但需要知道初始化可能不完整
}

// --- 初始化 Drizzle ORM ---
const db = drizzle(sqlite, { schema, logger: true }); // 启用 logger 可以看到 Drizzle 执行的 SQL
console.log('Drizzle ORM 初始化完成');

// --- 导出数据库实例 ---
export { db, sqlite }; // 导出原始 sqlite 连接可能不是必须的，除非你直接用它
