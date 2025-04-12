#!/usr/bin/env node

/**
 * 创建管理员账户脚本
 * 
 * 此脚本用于创建博客系统的管理员账户
 */

const { db } = require('../dist/lib/db');
const { sql } = require('drizzle-orm');
const readline = require('readline');
const bcrypt = require('bcryptjs');

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
  console.log('创建管理员账户');
  console.log('================');

  try {
    // 获取用户输入
    const email = await prompt('请输入管理员邮箱: ');
    if (!email || !email.includes('@')) {
      console.error('错误: 请输入有效的邮箱地址');
      rl.close();
      return;
    }

    // 检查邮箱是否已存在
    const existingUser = await db.select({ count: sql`count(*)` })
      .from(sql`users`)
      .where(sql`email = ${email}`);

    if (existingUser[0].count > 0) {
      console.error('错误: 该邮箱已被注册');
      rl.close();
      return;
    }

    // 获取密码
    const password = await prompt('请输入管理员密码 (至少6位): ');
    if (!password || password.length < 6) {
      console.error('错误: 密码长度不能少于6位');
      rl.close();
      return;
    }

    const confirmPassword = await prompt('请再次输入密码: ');
    if (password !== confirmPassword) {
      console.error('错误: 两次输入的密码不一致');
      rl.close();
      return;
    }

    // 加密密码
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 创建管理员账户
    await db.execute(sql`
      INSERT INTO users (email, password)
      VALUES (${email}, ${hashedPassword});
    `);

    console.log('✓ 管理员账户创建成功！');
    console.log(`邮箱: ${email}`);
    console.log('您现在可以使用这些凭据登录管理后台');
  } catch (error) {
    console.error('创建管理员账户失败:', error);
  } finally {
    rl.close();
  }
}

main();
