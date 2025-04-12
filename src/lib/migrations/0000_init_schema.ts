import { sql } from 'drizzle-orm';
import { db } from '../db';

export async function up() {
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    )`);

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      content TEXT NOT NULL,
      excerpt TEXT,
      published INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      authorId INTEGER REFERENCES users(id)
    )`);

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    )`);

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    )`);

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS post_tags (
      postId INTEGER REFERENCES posts(id),
      tagId INTEGER REFERENCES tags(id),
      PRIMARY KEY (postId, tagId)
    )`);

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS post_categories (
      postId INTEGER REFERENCES posts(id),
      categoryId INTEGER REFERENCES categories(id),
      PRIMARY KEY (postId, categoryId)
    )`);

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS media (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT NOT NULL,
      altText TEXT,
      width INTEGER,
      height INTEGER,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    )`);
}

export async function down() {
  await db.run(sql`DROP TABLE IF EXISTS media`);
  await db.run(sql`DROP TABLE IF EXISTS post_categories`);
  await db.run(sql`DROP TABLE IF EXISTS post_tags`);
  await db.run(sql`DROP TABLE IF EXISTS tags`);
  await db.run(sql`DROP TABLE IF EXISTS categories`);
  await db.run(sql`DROP TABLE IF EXISTS posts`);
  await db.run(sql`DROP TABLE IF EXISTS users`);
}
