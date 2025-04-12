// 添加缺失表的脚本
const Database = require('better-sqlite3');
const path = require('path');

// 初始化数据库连接
const dbPath = path.resolve(process.cwd(), './blog.db');
console.log('数据库文件路径:', dbPath);

const sqlite = new Database(dbPath, { verbose: console.log });
console.log('SQLite 数据库连接成功');

try {
  // 创建网站设置表
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS site_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT,
      "group" TEXT NOT NULL DEFAULT 'general',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TEXT
    );
  `);

  // 创建社交媒体链接表
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

  // 创建联系方式表
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

  // 创建打赏信息表
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

  // 创建Hero区域设置表
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

  // 添加默认网站设置
  try {
    const settingsCount = sqlite.prepare('SELECT COUNT(*) as count FROM site_settings').get();
    if (settingsCount.count === 0) {
      console.log('添加默认网站设置数据...');
      sqlite.exec(`
        INSERT INTO site_settings (key, value, "group") VALUES 
        ('title', '向阳乔木的个人博客', 'general'),
        ('description', '分享技术、生活和思考，记录成长的点滴。', 'general'),
        ('logo', '/images/logo.png', 'general'),
        ('favicon', '/favicon.ico', 'general'),
        ('copyright', ' 2025 向阳乔木的个人博客. All rights reserved.', 'general');
      `);
    }
  } catch (error) {
    console.error('添加默认网站设置失败:', error);
  }
  
  // 添加默认社交媒体链接
  try {
    const socialCount = sqlite.prepare('SELECT COUNT(*) as count FROM social_links').get();
    if (socialCount.count === 0) {
      console.log('添加默认社交媒体链接数据...');
      sqlite.exec(`
        INSERT INTO social_links (platform, url, icon, display_name, "order") VALUES 
        ('github', 'https://github.com', 'github', 'GitHub', 0),
        ('twitter', 'https://twitter.com', 'twitter', 'Twitter', 1),
        ('weibo', 'https://weibo.com', 'weibo', '微博', 2);
      `);
    }
  } catch (error) {
    console.error('添加默认社交媒体链接失败:', error);
  }
  
  // 添加默认联系方式
  try {
    const contactCount = sqlite.prepare('SELECT COUNT(*) as count FROM contact_info').get();
    if (contactCount.count === 0) {
      console.log('添加默认联系方式数据...');
      sqlite.exec(`
        INSERT INTO contact_info (type, value, display_name) VALUES 
        ('email', 'example@example.com', '邮箱'),
        ('wechat', 'wechat_id', '微信');
      `);
    }
  } catch (error) {
    console.error('添加默认联系方式失败:', error);
  }
  
  // 添加默认Hero区域设置
  try {
    const heroCount = sqlite.prepare('SELECT COUNT(*) as count FROM hero_settings').get();
    if (heroCount.count === 0) {
      console.log('添加默认Hero区域设置数据...');
      sqlite.exec(`
        INSERT INTO hero_settings (title, subtitle, background_image_url, button_text, button_url) VALUES 
        ('向阳乔木的个人博客', '分享技术、生活和思考', '/images/hero-bg.jpg', '了解更多', '/about');
      `);
    }
  } catch (error) {
    console.error('添加默认Hero区域设置失败:', error);
  }

  console.log('缺失的表和默认数据添加成功');
} catch (error) {
  console.error('添加缺失表失败:', error);
} finally {
  // 关闭数据库连接
  sqlite.close();
}
