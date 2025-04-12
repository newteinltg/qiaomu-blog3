const fs = require('fs');
const path = require('path');
const { Database } = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

// 路径配置
const sourceDbPath = path.join(__dirname, '..', 'blog.db');
const demoDbPath = path.join(__dirname, '..', 'demo.db');

// 确保源数据库存在
if (!fs.existsSync(sourceDbPath)) {
  console.error('源数据库不存在:', sourceDbPath);
  process.exit(1);
}

// 复制数据库文件
try {
  fs.copyFileSync(sourceDbPath, demoDbPath);
  console.log(`✓ 已复制数据库: ${sourceDbPath} -> ${demoDbPath}`);
} catch (error) {
  console.error('复制数据库失败:', error);
  process.exit(1);
}

// 打开演示数据库
const db = new Database(demoDbPath, (err) => {
  if (err) {
    console.error('打开数据库失败:', err);
    process.exit(1);
  }
});

// 生成演示管理员密码的哈希
async function createDemoAdmin() {
  try {
    // 生成密码哈希
    const salt = await bcrypt.genSalt(10);
    const demoPassword = 'demo123456'; // 演示密码
    const hashedPassword = await bcrypt.hash(demoPassword, salt);
    
    // 删除现有用户
    db.run('DELETE FROM users', function(err) {
      if (err) {
        console.error('删除现有用户失败:', err);
        return;
      }
      
      console.log('✓ 已删除现有用户');
      
      // 创建演示管理员账户
      db.run(
        'INSERT INTO users (email, password, createdAt) VALUES (?, ?, ?)',
        ['demo@example.com', hashedPassword, new Date().toISOString()],
        function(err) {
          if (err) {
            console.error('创建演示管理员失败:', err);
            return;
          }
          
          console.log('✓ 已创建演示管理员账户:');
          console.log('  邮箱: demo@example.com');
          console.log('  密码: demo123456');
          
          // 关闭数据库连接
          db.close((err) => {
            if (err) {
              console.error('关闭数据库失败:', err);
              return;
            }
            
            console.log('✓ 演示数据库创建完成!');
            console.log(`数据库路径: ${demoDbPath}`);
          });
        }
      );
    });
  } catch (error) {
    console.error('处理密码哈希失败:', error);
    db.close();
  }
}

// 执行创建演示管理员
createDemoAdmin();
