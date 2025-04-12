// 重置分类数据的脚本
const path = require('path');

// 直接使用 SQLite 进行操作
const Database = require('better-sqlite3');
const dbPath = path.resolve(process.cwd(), './blog.db');
const sqlite = new Database(dbPath);

function resetCategories() {
  try {
    console.log('开始重置分类数据...');
    
    // 检查是否有文章使用分类
    const stmt = sqlite.prepare('SELECT COUNT(*) as count FROM posts WHERE categoryId IS NOT NULL');
    const result = stmt.get();
    
    if (result.count > 0) {
      console.log(`有 ${result.count} 篇文章使用了分类，将它们的分类设为 null`);
      sqlite.exec('UPDATE posts SET categoryId = NULL WHERE categoryId IS NOT NULL');
    }
    
    // 删除所有分类
    console.log('删除所有分类数据...');
    sqlite.exec('DELETE FROM categories');
    
    // 重置自增 ID
    sqlite.exec("DELETE FROM sqlite_sequence WHERE name = 'categories'");
    
    // 添加示例分类
    console.log('添加示例分类...');
    sqlite.exec(`
      INSERT INTO categories (name, slug, description, parent_id, "order", created_at) VALUES 
      ('未分类', 'uncategorized', '默认分类', NULL, 0, CURRENT_TIMESTAMP),
      ('技术', 'technology', '技术相关文章', NULL, 10, CURRENT_TIMESTAMP),
      ('生活', 'life', '生活相关文章', NULL, 20, CURRENT_TIMESTAMP),
      ('前端开发', 'frontend', '前端开发相关文章', 2, 0, CURRENT_TIMESTAMP),
      ('后端开发', 'backend', '后端开发相关文章', 2, 10, CURRENT_TIMESTAMP),
      ('旅行', 'travel', '旅行相关文章', 3, 0, CURRENT_TIMESTAMP)
    `);
    
    // 查询新的分类列表
    const categories = sqlite.prepare('SELECT * FROM categories ORDER BY "order"').all();
    console.log('分类重置完成，当前分类列表:');
    console.table(categories);
    
  } catch (error) {
    console.error('重置分类失败:', error);
  } finally {
    // 关闭数据库连接
    sqlite.close();
  }
}

resetCategories();
