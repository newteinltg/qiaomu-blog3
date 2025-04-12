import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('开始创建菜单表...');

  try {
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
        updated_at TEXT,
        FOREIGN KEY (parent_id) REFERENCES menus(id)
      );
    `);

    console.log('菜单表创建成功！');
  } catch (error) {
    console.error('创建菜单表失败:', error);
    process.exit(1);
  }
}

main().then(() => process.exit(0));
