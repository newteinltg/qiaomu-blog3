import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize SQLite database
const sqlite = new Database('./blog.db');
const db = drizzle(sqlite);

// Define migrations folder path
const migrationsFolder = path.join(__dirname, 'migrations');

// Run migrations
console.log('Starting database migrations...');
try {
  migrate(db, { migrationsFolder });
  console.log('Migrations completed successfully');
} catch (err) {
  console.error('Migration failed:', err);
  process.exit(1);
}

// Close database connection
sqlite.close();