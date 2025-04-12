import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export async function up(db: any): Promise<void> {
  // 创建head_scripts表
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS head_scripts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      code TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'analytics',
      is_active INTEGER NOT NULL DEFAULT 1,
      position TEXT NOT NULL DEFAULT 'head',
      pages TEXT,
      "order" INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT
    );
  `);
}

export async function down(db: any): Promise<void> {
  // 删除head_scripts表
  await db.run(sql`DROP TABLE IF EXISTS head_scripts;`);
}
