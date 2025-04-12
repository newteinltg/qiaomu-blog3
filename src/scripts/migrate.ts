import { db } from '../lib/db';
import { sql } from 'drizzle-orm';
import Database from 'better-sqlite3';

console.log('开始执行数据库迁移...');

// 初始化 SQLite 数据库连接
const sqlite = new Database('./blog.db');

async function migrate() {
  try {
    // 检查 categories 表是否存在
    const categoriesTableExists = sqlite.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='categories';
    `).get();

    if (!categoriesTableExists) {
      console.log('创建 categories 表...');
      sqlite.exec(`
        CREATE TABLE IF NOT EXISTS categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE NOT NULL,
          slug TEXT UNIQUE NOT NULL,
          description TEXT,
          parent_id INTEGER,
          "order" INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT
        );
      `);
      console.log('categories 表创建成功');
    } else {
      console.log('categories 表已存在');
      
      // 检查 parent_id 字段是否存在
      const parentIdExists = sqlite.prepare(`
        PRAGMA table_info(categories);
      `).all().some((column: any) => column.name === 'parent_id');
      
      if (!parentIdExists) {
        console.log('添加 parent_id 字段到 categories 表...');
        sqlite.exec(`ALTER TABLE categories ADD COLUMN parent_id INTEGER REFERENCES categories(id);`);
        console.log('parent_id 字段添加成功');
      }
      
      // 检查 order 字段是否存在
      const orderExists = sqlite.prepare(`
        PRAGMA table_info(categories);
      `).all().some((column: any) => column.name === 'order');
      
      if (!orderExists) {
        console.log('添加 order 字段到 categories 表...');
        sqlite.exec(`ALTER TABLE categories ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;`);
        console.log('order 字段添加成功');
      }
      
      // 检查 updated_at 字段是否存在
      const updatedAtExists = sqlite.prepare(`
        PRAGMA table_info(categories);
      `).all().some((column: any) => column.name === 'updated_at');
      
      if (!updatedAtExists) {
        console.log('添加 updated_at 字段到 categories 表...');
        sqlite.exec(`ALTER TABLE categories ADD COLUMN updated_at TEXT;`);
        console.log('updated_at 字段添加成功');
      }
    }

    // 检查 posts 表中是否有 categoryId 字段
    const categoryIdExists = sqlite.prepare(`
      PRAGMA table_info(posts);
    `).all().some((column: any) => column.name === 'categoryId');

    if (!categoryIdExists) {
      console.log('添加 categoryId 字段到 posts 表...');
      sqlite.exec(`ALTER TABLE posts ADD COLUMN categoryId INTEGER REFERENCES categories(id);`);
      console.log('categoryId 字段添加成功');
    } else {
      console.log('posts 表已有 categoryId 字段');
    }

    console.log('数据库迁移完成');
  } catch (error) {
    console.error('数据库迁移失败:', error);
  }
}

migrate().then(() => {
  console.log('迁移脚本执行完毕');
  process.exit(0);
}).catch((error) => {
  console.error('迁移脚本执行失败:', error);
  process.exit(1);
});
