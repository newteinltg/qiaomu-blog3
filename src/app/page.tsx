import { db } from '@/lib/db';
import * as schema from '@/lib/schema';
import { eq, desc, sql } from 'drizzle-orm';
import Link from 'next/link';
import Image from 'next/image';
import { formatDate } from '@/lib/utils';
import { Metadata } from 'next';
import Sidebar from '@/components/Sidebar';
import FeaturedSlider from '@/components/FeaturedSlider';
import SimpleNavigation from '@/components/SimpleNavigation';
import SimpleFooter from '@/components/SimpleFooter';
import LatestArticles from '@/components/LatestArticles';
import { getCategories, getTags, getMenus, getAllSettings } from '@/lib/services/settings';

export const metadata: Metadata = {
  title: '向阳乔木的个人博客',
  description: '分享技术、生活和思考，记录成长的点滴。',
};

export default async function Home() {
  // 获取分类、标签和菜单
  const [categories, tags, menus, settings] = await Promise.all([
    getCategories(),
    getTags(),
    getMenus(),
    getAllSettings()
  ]);

  // 获取网站设置
  const siteSettings = settings.reduce((acc, setting) => {
    acc[setting.key] = setting.value;
    return acc;
  }, {} as Record<string, string | null>);

  // 获取置顶文章
  const pinnedPosts = await db
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
    .where(eq(schema.posts.pinned, 1))
    .leftJoin(schema.users, eq(schema.posts.authorId, schema.users.id))
    .leftJoin(schema.categories, eq(schema.posts.categoryId, schema.categories.id))
    .orderBy(desc(schema.posts.createdAt))
    .limit(5); // 最多显示5篇置顶文章

  // 获取最新文章
  const latestPosts = await db
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

  // 为每篇文章获取标签
  const postsWithTags = await Promise.all(latestPosts.map(async (post) => {
    // 获取文章的标签
    const postTags = await db
      .select({
        id: schema.tags.id,
        name: schema.tags.name,
        slug: schema.tags.slug,
      })
      .from(schema.postTags)
      .where(eq(schema.postTags.postId, post.id))
      .leftJoin(schema.tags, eq(schema.postTags.tagId, schema.tags.id));

    return {
      ...post,
      tags: postTags
    };
  }));

  return (
    <div className="min-h-screen flex flex-col">
      {/* 导航栏 */}
      <SimpleNavigation siteTitle={siteSettings.site_name || '向阳乔木的个人博客'} menus={menus} />

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

      <div className="max-w-6xl mx-auto px-4 mt-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧内容区 */}
          <div className="col-span-1 lg:col-span-2">
            {/* 推荐文章轮播 */}
            <FeaturedSlider posts={pinnedPosts} />

            {/* 最新文章列表 */}
            <LatestArticles posts={postsWithTags} className="mt-4" />
          </div>

          {/* 侧边栏 */}
          <div className="col-span-1">
            <Sidebar categories={categories} tags={tags} isHomePage={true} />
          </div>
        </div>
      </div>

      {/* 页脚 */}
      <SimpleFooter />
    </div>
  );
}
