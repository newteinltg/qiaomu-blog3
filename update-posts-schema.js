// 更新文章表结构，添加 pinned 字段
const sqlite3 = require('sqlite3').verbose();

// 打开数据库连接
const db = new sqlite3.Database('./blog.db', (err) => {
  if (err) {
    console.error('无法连接到数据库:', err.message);
    process.exit(1);
  }
  console.log('已连接到 SQLite 数据库');
});

// 开始事务
db.serialize(() => {
  // 启用外键约束
  db.run('PRAGMA foreign_keys = OFF;');
  
  // 开始事务
  db.run('BEGIN TRANSACTION;');
  
  try {
    // 检查 pinned 字段是否已存在
    db.all("PRAGMA table_info(posts);", (err, rows) => {
      if (err) {
        throw err;
      }
      
      // 检查字段是否存在
      const hasPinnedColumn = rows && rows.some(row => row.name === 'pinned');
      
      if (!hasPinnedColumn) {
        console.log('添加 pinned 字段到 posts 表...');
        
        // 添加 pinned 字段
        db.run('ALTER TABLE posts ADD COLUMN pinned INTEGER DEFAULT 0;', (err) => {
          if (err) {
            throw err;
          }
          console.log('成功添加 pinned 字段');
          
          // 提交事务
          db.run('COMMIT;', (err) => {
            if (err) {
              throw err;
            }
            console.log('事务已提交');
            
            // 查询文章数据
            db.all('SELECT id, title, slug, published, pinned FROM posts;', (err, rows) => {
              if (err) {
                console.error('查询文章失败:', err.message);
              } else {
                console.log('数据库中的文章:');
                console.table(rows);
              }
              
              // 关闭数据库连接
              db.close((err) => {
                if (err) {
                  console.error('关闭数据库连接时出错:', err.message);
                }
                console.log('数据库连接已关闭');
              });
            });
          });
        });
      } else {
        console.log('pinned 字段已存在，无需添加');
        
        // 查询文章数据
        db.all('SELECT id, title, slug, published, pinned FROM posts;', (err, rows) => {
          if (err) {
            console.error('查询文章失败:', err.message);
          } else {
            console.log('数据库中的文章:');
            console.table(rows);
          }
          
          // 关闭数据库连接
          db.close((err) => {
            if (err) {
              console.error('关闭数据库连接时出错:', err.message);
            }
            console.log('数据库连接已关闭');
          });
        });
      }
    });
  } catch (error) {
    // 发生错误时回滚事务
    console.error('执行迁移时出错:', error);
    db.run('ROLLBACK;', () => {
      console.log('事务已回滚');
      
      // 关闭数据库连接
      db.close((err) => {
        if (err) {
          console.error('关闭数据库连接时出错:', err.message);
        }
        console.log('数据库连接已关闭');
      });
    });
  }
});
