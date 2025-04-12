// 添加文章封面字段的迁移脚本
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 数据库文件路径
const dbPath = path.join(process.cwd(), 'blog.db');

// 连接到数据库
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('无法连接到数据库:', err.message);
    process.exit(1);
  }
  console.log('已连接到SQLite数据库');
});

// 检查posts表是否存在coverImage列
db.all("PRAGMA table_info(posts)", (err, rows) => {
  if (err) {
    console.error('查询表结构时出错:', err.message);
    closeDb();
    process.exit(1);
  }

  // 检查coverImage列是否存在
  const hasColumn = rows && rows.some(row => row.name === 'coverImage');
  
  if (!hasColumn) {
    // 添加coverImage列
    db.run("ALTER TABLE posts ADD COLUMN coverImage TEXT", (err) => {
      if (err) {
        console.error('添加coverImage列时出错:', err.message);
      } else {
        console.log('成功添加coverImage列到posts表');
      }
      closeDb();
    });
  } else {
    console.log('coverImage列已存在，无需修改');
    closeDb();
  }
});

// 关闭数据库连接
function closeDb() {
  db.close((err) => {
    if (err) {
      console.error('关闭数据库连接时出错:', err.message);
    } else {
      console.log('数据库连接已关闭');
    }
  });
}
