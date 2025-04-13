import { db } from '@/lib/db';
import * as schema from '@/lib/schema';
import { eq, desc, sql, and } from 'drizzle-orm';
import Link from 'next/link';
import Image from 'next/image';
import { formatDate } from '@/lib/utils';
import { Metadata } from 'next';
import { unstable_noStore } from 'next/cache';
import SimpleNavigation from '@/components/SimpleNavigation';
import SimpleFooter from '@/components/SimpleFooter';
import FeaturedSlider from '@/components/FeaturedSlider';
import LatestArticles from '@/components/LatestArticles';
import Sidebar from '@/components/Sidebar';
import { getCategories, getTags, getMenus, getSiteSettings } from '@/lib/services/settings';
import { Post } from '@/types';
import { adaptMenus } from '@/lib/utils/menu-adapters';

export const metadata: Metadata = {
  title: '向阳乔木的个人博客',
  description: '分享技术、生活和思考，记录成长的点滴。',
};

// 强制动态渲染，确保每次访问都获取最新数据
export const dynamic = 'force-dynamic';

export default async function Home() {
  // 获取分类、标签和菜单
  const [categories, tags, menus, settings] = await Promise.all([
    getCategories(),
    getTags(),
    getMenus(),
    getSiteSettings(),
  ]);

  // 获取网站设置
  const siteSettings = Array.isArray(settings) 
    ? settings.reduce((acc: Record<string, string | null>, setting: { key: string, value: string | null }) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {} as Record<string, string | null>)
    : settings;

  // 获取置顶文章
  const pinnedPostsData = await db
    .select({
      id: schema.posts.id,
      title: schema.posts.title,
      slug: schema.posts.slug,
      excerpt: schema.posts.excerpt,
      coverImage: schema.posts.coverImage,
      createdAt: schema.posts.createdAt,
      pinned: schema.posts.pinned,
      author: {
        id: schema.users.id,
        email: schema.users.email,
      },
      category: {
        id: schema.categories.id,
        name: schema.categories.name,
        slug: schema.categories.slug,
      },
    })
    .from(schema.posts)
    .where(and(
      eq(schema.posts.published, 1),
      eq(schema.posts.pinned, 1)
    ))
    .leftJoin(schema.users, eq(schema.posts.authorId, schema.users.id))
    .leftJoin(schema.categories, eq(schema.posts.categoryId, schema.categories.id))
    .orderBy(desc(schema.posts.createdAt))
    .limit(5); // 最多显示5篇置顶文章

  // 转换类型以匹配组件期望的类型
  const pinnedPosts: Post[] = pinnedPostsData.map(post => ({
    ...post,
    pinned: post.pinned === null ? undefined : Boolean(post.pinned),
    author: post.author === null ? undefined : {
      ...post.author,
      email: post.author.email || null
    },
    category: post.category === null ? undefined : {
      ...post.category,
      name: post.category.name || null,
      slug: post.category.slug || null
    }
  }));

  // 添加随机查询参数，确保每次都获取最新数据
  const randomParam = Date.now();

  // 获取最新文章
  const latestPostsData = await db
    .select({
      id: schema.posts.id,
      title: schema.posts.title,
      slug: schema.posts.slug,
      excerpt: schema.posts.excerpt,
      coverImage: schema.posts.coverImage,
      createdAt: schema.posts.createdAt,
      pinned: schema.posts.pinned,
      author: {
        id: schema.users.id,
        email: schema.users.email,
      },
      category: {
        id: schema.categories.id,
        name: schema.categories.name,
        slug: schema.categories.slug,
      },
    })
    .from(schema.posts)
    .where(eq(schema.posts.published, 1))
    .leftJoin(schema.users, eq(schema.posts.authorId, schema.users.id))
    .leftJoin(schema.categories, eq(schema.posts.categoryId, schema.categories.id))
    .orderBy(desc(schema.posts.createdAt))
    .limit(10);

  // 为每篇文章获取标签并转换类型
  const postsWithTags: Post[] = await Promise.all(latestPostsData.map(async post => {
    // 获取文章的标签
    const postTags = await db
      .select({
        id: schema.tags.id,
        name: schema.tags.name,
        slug: schema.tags.slug,
      })
      .from(schema.postTags)
      .leftJoin(schema.tags, eq(schema.postTags.tagId, schema.tags.id))
      .where(eq(schema.postTags.postId, post.id));

    return {
      ...post,
      pinned: post.pinned === null ? undefined : Boolean(post.pinned),
      author: post.author === null ? undefined : {
        ...post.author,
        email: post.author.email || null
      },
      category: post.category === null ? undefined : {
        ...post.category,
        name: post.category.name || null,
        slug: post.category.slug || null
      },
      tags: postTags.map(tag => ({
        id: tag.id || 0, // 确保id不为null
        name: tag.name || '', // 确保name不为null
        slug: tag.slug || '' // 确保slug不为null
      }))
    };
  }));

  return (
    <div className="min-h-screen flex flex-col">
      {/* 导航栏 */}
      <SimpleNavigation siteTitle={siteSettings.site_name || '向阳乔木的个人博客'} menus={adaptMenus(menus)} />

      {/* Hero区域 */}
      <section className="hero">
        <div className="hero-background">
          <div className="circle circle-1"></div>
          <div className="circle circle-2"></div>
          <div className="circle circle-3"></div>
        </div>
        <div className="container-wide max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="hero-content text-center">
            <h1 className="hero-title">{siteSettings.hero_title || '向阳乔木个人网站'}</h1>
            <p className="hero-subtitle">{siteSettings.hero_subtitle || '分享 AI 探索、实践，精选各类工具，一起学习进步。'}</p>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-0 sm:px-4 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧内容区 */}
          <div className="col-span-1 lg:col-span-2">
            {/* 推荐文章轮播 */}
            <FeaturedSlider posts={pinnedPosts} />

            {/* 最新文章列表 */}
            <LatestArticles posts={postsWithTags} className="mt-4" />
          </div>

          {/* 侧边栏 */}
          <div className="hidden lg:block lg:col-span-1">
            <Sidebar categories={categories} tags={tags} isHomePage={true} />
          </div>
        </div>
      </div>

      {/* 页脚 */}
      <SimpleFooter />
    </div>
  );
}
