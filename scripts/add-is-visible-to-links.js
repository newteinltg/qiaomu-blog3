const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 数据库文件路径
const dbPath = path.join(process.cwd(), 'links.db');

// 连接数据库
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('无法连接到数据库:', err.message);
    process.exit(1);
  }
  console.log('已连接到链接数据库');
});

// 检查 is_visible 字段是否已存在
db.all("PRAGMA table_info(links)", (err, rows) => {
  if (err) {
    console.error('查询表结构失败:', err.message);
    db.close();
    process.exit(1);
  }

  // 检查是否已存在 is_visible 字段
  const hasIsVisible = rows.some(row => row.name === 'is_visible');

  if (hasIsVisible) {
    console.log('is_visible 字段已存在，无需添加');
    db.close();
    return;
  }

  // 添加 is_visible 字段
  db.run("ALTER TABLE links ADD COLUMN is_visible INTEGER NOT NULL DEFAULT 1", (err) => {
    if (err) {
      console.error('添加 is_visible 字段失败:', err.message);
      db.close();
      process.exit(1);
    }

    console.log('成功添加 is_visible 字段到 links 表');

    // 设置所有现有链接为可见
    db.run("UPDATE links SET is_visible = 1", (err) => {
      if (err) {
        console.error('更新现有链接失败:', err.message);
      } else {
        console.log('已将所有现有链接设置为可见');
      }

      db.close();
    });
  });
});
