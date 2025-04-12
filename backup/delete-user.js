#!/usr/bin/env node

/**
 * 删除用户账号脚本
 * 
 * 此脚本用于删除指定ID的用户账号
 */

const Database = require('better-sqlite3');

// 连接到数据库
const db = new Database('./demo.db');

function deleteUser(userId) {
  try {
    console.log(`===== 删除用户账号 ID: ${userId} =====`);
    
    // 查找用户
    const user = db.prepare('SELECT id, email FROM users WHERE id = ?').get(userId);
    
    if (!user) {
      console.log(`❌ 未找到ID为 ${userId} 的用户账号`);
      return;
    }
    
    console.log(`找到用户: ID ${user.id}, 邮箱: ${user.email}`);
    
    // 删除用户
    const result = db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    
    if (result.changes > 0) {
      console.log(`✅ 已成功删除用户账号: ${user.email} (ID: ${userId})`);
    } else {
      console.log(`❌ 删除用户账号失败`);
    }
    
    // 显示剩余用户账户
    const users = db.prepare('SELECT id, email FROM users').all();
    console.log('\n当前系统中的用户账户:');
    users.forEach(user => {
      console.log(`ID: ${user.id}, 邮箱: ${user.email}`);
    });
    
  } catch (error) {
    console.error('错误:', error);
  } finally {
    // 关闭数据库连接
    db.close();
  }
}

// 删除ID为3的用户
deleteUser(3);
