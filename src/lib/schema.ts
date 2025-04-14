import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';
import { relations as relationsImport } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import {
  siteSettings, socialLinks, contactInfo, donationInfo, heroSettings,
  type SiteSetting, type NewSiteSetting, type SocialLink, type NewSocialLink,
  type ContactInfo, type NewContactInfo, type DonationInfo, type NewDonationInfo,
  type HeroSetting, type NewHeroSetting
} from './schema/settings';

import {
  links, webhooks,
  type Link, type NewLink, type Webhook, type NewWebhook
} from './schema/links';

// 用户表
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  createdAt: text('createdAt').notNull().default(sql`CURRENT_TIMESTAMP`),
});

// 分类表定义
export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  parentId: integer('parent_id'),
  order: integer('order').notNull().default(0),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at'),
});

// 分类表关系
export const categoriesRelations = relationsImport(categories, ({ one }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
  }),
}));

// 文章表
export const posts = sqliteTable('posts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  content: text('content').notNull(),
  excerpt: text('excerpt'),
  published: integer('published').default(0),
  pinned: integer('pinned').default(0),
  coverImage: text('coverImage'),
  // 文章类型: 'markdown'(默认) 或 'html'(完整HTML页面)
  pageType: text('pageType').notNull().default('markdown'),
  createdAt: text('createdAt').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updatedAt').notNull().default(sql`CURRENT_TIMESTAMP`),
  authorId: integer('authorId').references(() => users.id),
  categoryId: integer('categoryId').references(() => categories.id),
});

// 文章表关系
export const postsRelations = relationsImport(posts, ({ one, many }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [posts.categoryId],
    references: [categories.id],
  }),
  tags: many(postTags),
}));

// 标签表
export const tags = sqliteTable('tags', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

// 文章标签关联表
export const postTags = sqliteTable('post_tags', {
  postId: integer('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  tagId: integer('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (t) => ({
  pk: primaryKey({ columns: [t.postId, t.tagId] })
}));

// 标签关系
export const tagsRelations = relationsImport(tags, ({ many }) => ({
  posts: many(postTags),
}));

// 文章标签关系
export const postTagsRelations = relationsImport(postTags, ({ one }) => ({
  post: one(posts, {
    fields: [postTags.postId],
    references: [posts.id],
  }),
  tag: one(tags, {
    fields: [postTags.tagId],
    references: [tags.id],
  }),
}));

// 文章分类关联表
export const postCategories = sqliteTable('post_categories', {
  postId: integer('postId').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  categoryId: integer('categoryId').notNull().references(() => categories.id, { onDelete: 'cascade' }),
}, (t) => ({
  pk: primaryKey({ columns: [t.postId, t.categoryId] })
}));

// 文章分类关系
export const postCategoriesRelations = relationsImport(postCategories, ({ one }) => ({
  post: one(posts, {
    fields: [postCategories.postId],
    references: [posts.id],
  }),
  category: one(categories, {
    fields: [postCategories.categoryId],
    references: [categories.id],
  }),
}));

// 菜单表
export const menus = sqliteTable('menus', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  url: text('url'),
  isExternal: integer('is_external').notNull().default(0),
  parentId: integer('parent_id'),
  order: integer('sort_order').notNull().default(0),
  isActive: integer('is_active').notNull().default(1),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at'),
});

// 菜单表关系
export const menusRelations = relationsImport(menus, ({ one }) => ({
  parent: one(menus, {
    fields: [menus.parentId],
    references: [menus.id],
  }),
}));

// 媒体表
export const media = sqliteTable('media', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  url: text('url').notNull(),
  altText: text('altText'),
  width: integer('width'),
  height: integer('height'),
  createdAt: text('createdAt').notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Type declarations
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
export type Menu = typeof menus.$inferSelect;
export type NewMenu = typeof menus.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Media = typeof media.$inferSelect;
export type NewMedia = typeof media.$inferInsert;

// 导出设置相关的表和类型
export {
  siteSettings, socialLinks, contactInfo, donationInfo, heroSettings,
  type SiteSetting, type NewSiteSetting, type SocialLink, type NewSocialLink,
  type ContactInfo, type NewContactInfo, type DonationInfo, type NewDonationInfo,
  type HeroSetting, type NewHeroSetting
};

// 导出链接相关的表和类型
export {
  links, webhooks,
  type Link, type NewLink, type Webhook, type NewWebhook
};
