import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// 网站设置表
export const siteSettings = sqliteTable('site_settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').notNull().unique(),
  value: text('value'),
  setting_group: text('setting_group').notNull().default('general'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at'),
});

// 社交媒体链接表
export const socialLinks = sqliteTable('social_links', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  platform: text('platform').notNull(),
  url: text('url').notNull(),
  icon: text('icon'),
  displayName: text('display_name'),
  order: integer('order').notNull().default(0),
  isActive: integer('is_active').notNull().default(1),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at'),
});

// 联系方式表
export const contactInfo = sqliteTable('contact_info', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  type: text('type').notNull(), // 例如：wechat, email, phone
  value: text('value').notNull(),
  qrCodeUrl: text('qr_code_url'),
  displayName: text('display_name'),
  isActive: integer('is_active').notNull().default(1),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at'),
});

// 打赏信息表
export const donationInfo = sqliteTable('donation_info', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  type: text('type').notNull(), // 例如：wechat, alipay
  qrCodeUrl: text('qr_code_url').notNull(),
  description: text('description'),
  isActive: integer('is_active').notNull().default(1),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at'),
});

// Hero区域设置表
export const heroSettings = sqliteTable('hero_settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  subtitle: text('subtitle'),
  backgroundImageUrl: text('background_image_url'),
  buttonText: text('button_text'),
  buttonUrl: text('button_url'),
  isActive: integer('is_active').notNull().default(1),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at'),
});

// 类型定义
export type SiteSetting = typeof siteSettings.$inferSelect;
export type NewSiteSetting = typeof siteSettings.$inferInsert;
export type SocialLink = typeof socialLinks.$inferSelect;
export type NewSocialLink = typeof socialLinks.$inferInsert;
export type ContactInfo = typeof contactInfo.$inferSelect;
export type NewContactInfo = typeof contactInfo.$inferInsert;
export type DonationInfo = typeof donationInfo.$inferSelect;
export type NewDonationInfo = typeof donationInfo.$inferInsert;
// 头部脚本代码表
export const headScripts = sqliteTable('head_scripts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  code: text('code').notNull(),
  type: text('type').notNull().default('analytics'), // analytics, ads, custom
  isActive: integer('is_active').notNull().default(1),
  position: text('position').notNull().default('head'), // head, body_start, body_end
  pages: text('pages'), // 可以是特定页面路径的JSON数组，null表示所有页面
  order: integer('order').notNull().default(0),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at'),
});

export type HeroSetting = typeof heroSettings.$inferSelect;
export type NewHeroSetting = typeof heroSettings.$inferInsert;
export type HeadScript = typeof headScripts.$inferSelect;
export type NewHeadScript = typeof headScripts.$inferInsert;
