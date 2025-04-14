#!/usr/bin/env node

/**
 * 链接数据库初始化脚本
 * 
 * 此脚本用于初始化链接系统的数据库，创建必要的表结构
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// 数据库文件路径
const dbPath = path.join(process.cwd(), 'links.db');

async function main() {
  console.log('开始初始化链接数据库...');

  // 检查数据库文件是否存在，如果存在则备份
  if (fs.existsSync(dbPath)) {
    const backupPath = `${dbPath}.backup-${Date.now()}`;
    console.log(`数据库文件已存在，创建备份: ${backupPath}`);
    fs.copyFileSync(dbPath, backupPath);
  }

  // 创建或打开数据库连接
  const db = new sqlite3.Database(dbPath);

  try {
    // 创建链接表
    await new Promise((resolve, reject) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS links (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          url TEXT NOT NULL,
          description TEXT,
          cover_image TEXT,
          tags TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at TEXT
        );
      `, function(err) {
        if (err) reject(err);
        else resolve();
      });
    });
    console.log('✓ 链接表创建成功');

    // 创建Webhook表
    await new Promise((resolve, reject) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS webhooks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          url TEXT NOT NULL,
          secret TEXT,
          is_active INTEGER DEFAULT 1 NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at TEXT
        );
      `, function(err) {
        if (err) reject(err);
        else resolve();
      });
    });
    console.log('✓ Webhook表创建成功');

    console.log('链接数据库初始化完成！');
  } catch (error) {
    console.error('数据库初始化失败:', error);
    process.exit(1);
  } finally {
    // 关闭数据库连接
    db.close();
  }
}

main().then(() => process.exit(0));
