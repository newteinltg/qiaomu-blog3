const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const readline = require('readline');

// 创建readline接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 初始化SQLite数据库
const db = new Database('./demo.db');

async function promptUser(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function updatePassword() {
  try {
    console.log('===== 管理员账户更新工具 =====');
    
    // 显示当前管理员账户
    const currentUsers = db.prepare('SELECT id, email FROM users').all();
    if (currentUsers.length > 0) {
      console.log('\n当前管理员账户:');
      currentUsers.forEach(user => {
        console.log(`ID: ${user.id}, 邮箱: ${user.email}`);
      });
    } else {
      console.log('数据库中没有管理员账户');
    }
    
    // 询问用户要更新哪个账户
    const userId = await promptUser('\n请输入要更新的账户ID (如果要创建新账户，请输入"new"): ');
    
    if (userId.toLowerCase() === 'new') {
      // 创建新账户
      const email = await promptUser('请输入新管理员邮箱: ');
      const password = await promptUser('请输入新管理员密码: ');
      
      // 生成盐并哈希密码
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      // 将新用户插入数据库
      const insertStmt = db.prepare('INSERT INTO users (email, password) VALUES (?, ?)');
      const result = insertStmt.run(email, hashedPassword);
      
      if (result.changes > 0) {
        console.log(`\n成功创建管理员账户: ${email}`);
      } else {
        console.log('\n创建账户失败');
      }
    } else {
      // 更新现有账户
      const id = parseInt(userId);
      const user = db.prepare('SELECT email FROM users WHERE id = ?').get(id);
      
      if (!user) {
        console.log(`\n未找到ID为 ${id} 的用户`);
      } else {
        const newEmail = await promptUser(`请输入新邮箱 (当前: ${user.email}，按Enter保持不变): `);
        const password = await promptUser('请输入新密码: ');
        
        // 生成盐并哈希密码
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // 更新用户信息
        const updateStmt = db.prepare('UPDATE users SET password = ?, email = ? WHERE id = ?');
        const email = newEmail.trim() || user.email;
        const result = updateStmt.run(hashedPassword, email, id);
        
        if (result.changes > 0) {
          console.log(`\n成功更新账户 ${email} 的密码`);
        } else {
          console.log('\n更新失败');
        }
      }
    }
  } catch (error) {
    console.error('错误:', error);
  } finally {
    // 关闭数据库连接和readline接口
    db.close();
    rl.close();
  }
}

// 运行函数
updatePassword();
