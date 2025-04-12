import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import * as schema from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';

// 创建一个直接的数据库连接，用于执行 SQL
const sqlite = new Database('blog.db');
const dbDirect = drizzle(sqlite);

// 定义标签类型
interface Tag {
  id: number;
  name: string;
  slug: string | null;
  description: string | null;
}

async function main() {
  console.log('开始更新标签表...');

  try {
    // 检查 tags 表是否存在
    const tableExists = sqlite.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='tags';
    `).all();

    if (tableExists.length === 0) {
      console.log('标签表不存在，正在创建...');
      
      // 创建标签表
      sqlite.exec(`
        CREATE TABLE tags (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          slug TEXT NOT NULL,
          description TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      console.log('标签表创建成功！');
    } else {
      console.log('标签表已存在，检查列...');
      
      // 检查列结构
      const columns = sqlite.prepare('PRAGMA table_info(tags);').all();
      const columnNames = columns.map((col: any) => col.name);
      
      console.log('现有列:', columnNames);
      
      // 检查是否需要添加 slug 列
      if (!columnNames.includes('slug')) {
        console.log('添加 slug 列...');
        sqlite.exec('ALTER TABLE tags ADD COLUMN slug TEXT;');
        console.log('slug 列添加成功！');
      }
      
      // 检查是否需要添加 description 列
      if (!columnNames.includes('description')) {
        console.log('添加 description 列...');
        sqlite.exec('ALTER TABLE tags ADD COLUMN description TEXT;');
        console.log('description 列添加成功！');
      }
      
      // 检查是否需要添加 created_at 列
      if (!columnNames.includes('created_at')) {
        console.log('添加 created_at 列...');
        sqlite.exec('ALTER TABLE tags ADD COLUMN created_at TEXT DEFAULT CURRENT_TIMESTAMP;');
        console.log('created_at 列添加成功！');
      }
      
      // 为现有记录生成 slug
      const tags = sqlite.prepare('SELECT id, name, slug FROM tags;').all() as Tag[];
      console.log(`找到 ${tags.length} 个标签`);
      
      for (const tag of tags) {
        if (!tag.slug) {
          const slug = tag.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\u4e00-\u9fa5]+/g, '-');
          console.log(`为标签 "${tag.name}" 生成 slug: ${slug}`);
          
          sqlite.prepare('UPDATE tags SET slug = ? WHERE id = ?').run(slug, tag.id);
        }
      }
    }
    
    // 检查是否有标签数据
    const result = sqlite.prepare('SELECT COUNT(*) as count FROM tags;').get() as { count: number };
    const tagCount = result.count;
    
    // 如果没有数据，添加一些示例标签
    if (tagCount === 0) {
      console.log('添加示例标签...');
      
      const sampleTags = [
        { name: '技术', slug: 'technology', description: '技术相关文章' },
        { name: '生活', slug: 'life', description: '生活随笔' },
        { name: '编程', slug: 'programming', description: '编程相关文章' },
        { name: '旅行', slug: 'travel', description: '旅行见闻' }
      ];
      
      // 检查表中是否有 created_at 列
      const hasCreatedAt = sqlite.prepare('PRAGMA table_info(tags);').all()
        .some((col: any) => col.name === 'created_at');
      
      let insertStmt;
      if (hasCreatedAt) {
        insertStmt = sqlite.prepare(
          'INSERT INTO tags (name, slug, description, created_at) VALUES (?, ?, ?, ?)'
        );
        
        for (const tag of sampleTags) {
          insertStmt.run(
            tag.name, 
            tag.slug, 
            tag.description, 
            new Date().toISOString()
          );
        }
      } else {
        insertStmt = sqlite.prepare(
          'INSERT INTO tags (name, slug, description) VALUES (?, ?, ?)'
        );
        
        for (const tag of sampleTags) {
          insertStmt.run(
            tag.name, 
            tag.slug, 
            tag.description
          );
        }
      }
      
      console.log('示例标签添加成功！');
    }
    
    console.log('标签表更新完成！');
  } catch (error) {
    console.error('更新标签表失败:', error);
    process.exit(1);
  } finally {
    // 关闭数据库连接
    sqlite.close();
  }
}

main().then(() => process.exit(0));
