// 添加 pageType 字段到 posts 表
export async function up(db) {
  // 检查 pageType 列是否已存在
  const tableInfo = await db.all("PRAGMA table_info(posts)");
  const pageTypeExists = tableInfo.some(column => column.name === 'pageType');
  
  if (!pageTypeExists) {
    // 添加 pageType 列，默认值为 'markdown'
    await db.run("ALTER TABLE posts ADD COLUMN pageType TEXT NOT NULL DEFAULT 'markdown'");
    console.log('Added pageType column to posts table');
  } else {
    console.log('pageType column already exists in posts table');
  }
}

export async function down(db) {
  // SQLite 不支持直接删除列，所以这里我们不实现回滚操作
  console.log('SQLite does not support dropping columns directly');
}
