// 运行单个迁移脚本
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 迁移脚本名称作为命令行参数
const migrationName = process.argv[2];

if (!migrationName) {
  console.error('请提供迁移脚本名称');
  process.exit(1);
}

async function runMigration() {
  // 打开数据库连接
  const db = await open({
    filename: path.join(__dirname, '..', 'blog.db'),
    driver: sqlite3.Database
  });

  try {
    // 导入迁移脚本
    const migrationPath = `../migrations/${migrationName}.js`;
    const migration = await import(migrationPath);

    // 执行迁移
    console.log(`执行迁移: ${migrationName}`);
    await migration.up(db);
    console.log(`迁移完成: ${migrationName}`);

  } catch (error) {
    console.error('迁移失败:', error);
  } finally {
    // 关闭数据库连接
    await db.close();
  }
}

runMigration();
