#!/usr/bin/env node

/**
 * 重置管理员账户脚本
 * 
 * 此脚本用于重置博客系统管理员账户，使其与README中的信息一致
 */

const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

// 连接到数据库
const db = new Database('./demo.db');

async function resetAdminAccount() {
  try {
    console.log('===== 重置管理员账户 =====');
    
    // README中的管理员账户信息
    const email = 'admin@example.com';
    const password = 'admin123';
    
    // 生成密码哈希
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // 检查是否已存在此邮箱的账户
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    
    if (existingUser) {
      // 更新现有账户
      db.prepare('UPDATE users SET password = ? WHERE email = ?').run(hashedPassword, email);
      console.log(`✅ 已更新管理员账户 ${email} 的密码`);
    } else {
      // 查找demo@example.com账户
      const demoUser = db.prepare('SELECT id FROM users WHERE email = ?').get('demo@example.com');
      
      if (demoUser) {
        // 将demo@example.com更新为admin@example.com
        db.prepare('UPDATE users SET email = ?, password = ? WHERE email = ?').run(email, hashedPassword, 'demo@example.com');
        console.log(`✅ 已将demo@example.com账户更新为 ${email}`);
      } else {
        // 创建新账户
        db.prepare('INSERT INTO users (email, password, createdAt) VALUES (?, ?, datetime("now"))').run(email, hashedPassword);
        console.log(`✅ 已创建新管理员账户: ${email}`);
      }
    }
    
    // 显示所有用户账户
    const users = db.prepare('SELECT id, email FROM users').all();
    console.log('\n当前系统中的用户账户:');
    users.forEach(user => {
      console.log(`ID: ${user.id}, 邮箱: ${user.email}`);
    });
    
    console.log('\n管理员账户已重置，现在可以使用以下信息登录:');
    console.log(`用户名: ${email}`);
    console.log(`密码: ${password}`);
    
  } catch (error) {
    console.error('错误:', error);
  } finally {
    // 关闭数据库连接
    db.close();
  }
}

// 运行函数
resetAdminAccount();
