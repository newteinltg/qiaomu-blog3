#!/usr/bin/env node

/**
 * 重置管理员密码脚本
 * 
 * 此脚本用于重置博客系统管理员的密码
 */

const Database = require('better-sqlite3');
const readline = require('readline');
const bcrypt = require('bcryptjs');
const path = require('path');

// 连接到数据库
const db = new Database('./demo.db');

// 创建命令行交互界面
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 提示用户输入
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function main() {
  console.log('重置管理员密码');
  console.log('================');

  try {
    // 获取所有用户
    const users = db.prepare('SELECT id, email FROM users').all();

    if (users.length === 0) {
      console.log('系统中没有用户，请先创建管理员账户');
      rl.close();
      return;
    }

    // 显示用户列表
    console.log('系统中的用户:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
    });

    // 选择要重置密码的用户
    const userIndex = await prompt('请选择要重置密码的用户 (输入序号): ');
    const selectedIndex = parseInt(userIndex) - 1;

    if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= users.length) {
      console.error('错误: 无效的选择');
      rl.close();
      return;
    }

    const selectedUser = users[selectedIndex];

    // 获取新密码
    const password = await prompt('请输入新密码 (至少6位): ');
    if (!password || password.length < 6) {
      console.error('错误: 密码长度不能少于6位');
      rl.close();
      return;
    }

    const confirmPassword = await prompt('请再次输入新密码: ');
    if (password !== confirmPassword) {
      console.error('错误: 两次输入的密码不一致');
      rl.close();
      return;
    }

    // 加密密码
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 更新密码
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, selectedUser.id);

    console.log('✓ 密码重置成功！');
    console.log(`用户: ${selectedUser.email}`);
    console.log('您现在可以使用新密码登录管理后台');
  } catch (error) {
    console.error('重置密码失败:', error);
  } finally {
    rl.close();
  }
}

main();
