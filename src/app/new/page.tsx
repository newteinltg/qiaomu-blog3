import { db } from '@/lib/db';
import * as schema from '@/lib/schema';
import { eq, desc, sql } from 'drizzle-orm';
import Link from 'next/link';
import Image from 'next/image';
import { formatDate } from '@/lib/utils';
import { Metadata } from 'next';
import Sidebar from '@/components/Sidebar';
import SimpleNavigation from '@/components/SimpleNavigation';
import Footer from '@/components/Footer';
import { getCategories, getTags } from '@/lib/services/settings';

export const metadata: Metadata = {
  title: '向阳乔木的个人博客',
  description: '分享技术、生活和思考',
};

export default async function HomePage() {
  // 获取分类和标签
  const categories = await getCategories();
  const tags = await getTags();

  // 获取最新文章
  const recentPosts = await db
    .select({
      id: schema.posts.id,
      title: schema.posts.title,
      slug: schema.posts.slug,
      excerpt: schema.posts.excerpt,
      coverImage: schema.posts.coverImage,
      createdAt: schema.posts.createdAt,
      pinned: schema.posts.pinned,
      authorEmail: schema.users.email,
      category: {
        id: schema.categories.id,
        name: schema.categories.name,
        slug: schema.categories.slug,
      },
      author: {
        id: schema.users.id,
        email: schema.users.email,
      },
    })
    .from(schema.posts)
    .leftJoin(schema.users, eq(schema.posts.authorId, schema.users.id))
    .leftJoin(schema.categories, eq(schema.posts.categoryId, schema.categories.id))
    .where(eq(schema.posts.published, 1))
    .orderBy(desc(schema.posts.pinned), desc(schema.posts.createdAt))
    .limit(6);

  // 获取特色文章
  const featuredPosts = await db
    .select({
      id: schema.posts.id,
      title: schema.posts.title,
      slug: schema.posts.slug,
      excerpt: schema.posts.excerpt,
      coverImage: schema.posts.coverImage,
      createdAt: schema.posts.createdAt,
      authorEmail: schema.users.email,
      categoryName: schema.categories.name,
    })
    .from(schema.posts)
    .leftJoin(schema.users, eq(schema.posts.authorId, schema.users.id))
    .leftJoin(schema.categories, eq(schema.posts.categoryId, schema.categories.id))
    .where(eq(schema.posts.featured, 1))
    .orderBy(desc(schema.posts.createdAt))
    .limit(5);

  return (
    <div className="min-h-screen flex flex-col">
      {/* 导航栏 */}
      <SimpleNavigation siteTitle="向阳乔木的个人博客" menus={[]} />

      {/* Hero区域 */}
      <section className="hero">
        <div className="hero-background">
          <div className="circle circle-1"></div>
          <div className="circle circle-2"></div>
          <div className="circle circle-3"></div>
        </div>
        <div className="container">
          <div className="hero-content text-center">
            <h1 className="hero-title">向阳乔木个人网站</h1>
            <p className="hero-subtitle">分享AI探索、实践，精选各类工具，一起学习进步。</p>
          </div>
        </div>
      </section>

      {/* 特色文章轮播 */}
      {featuredPosts.length > 0 && (
        <section className="py-8">
          <div className="container">
            <h2 className="text-2xl font-bold mb-6">推荐文章</h2>

            <div className="featured-slider">
              <div className="slider-container" style={{ height: '400px' }}>
                {featuredPosts.map((post, index) => (
                  <div key={post.id} className="slide">
                    {post.coverImage ? (
                      <Image
                        src={post.coverImage}
                        alt={post.title || ''}
                        fill
                        className="object-cover"
                        priority
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 dark:bg-gray-700"></div>
                    )}

                    <div className="slide-content">
                      {post.categoryName && (
                        <span className="slide-category">{post.categoryName}</span>
                      )}

                      <h3 className="slide-title">
                        <Link href={`/posts/${post.slug}`}>{post.title}</Link>
                      </h3>

                      {post.excerpt && (
                        <p className="slide-description">{post.excerpt}</p>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm">
                          <span className="mr-3">
                            {post.authorEmail ? post.authorEmail.split('@')[0] : '管理员'}
                          </span>
                          <span className="text-gray-300">
                            {formatDate(post.createdAt)}
                          </span>
                        </div>

                        <Link href={`/posts/${post.slug}`} className="inline-flex items-center text-primary-400 hover:text-primary-300 font-medium text-sm">
                          阅读全文
                          <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {featuredPosts.length > 1 && (
                <>
                  <div className="slider-controls">
                    <button className="slider-control prev">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"></path>
                      </svg>
                    </button>

                    <button className="slider-control next">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"></path>
                      </svg>
                    </button>
                  </div>

                  <div className="slider-dots">
                    {featuredPosts.map((_, index) => (
                      <button
                        key={index}
                        className={`slider-dot ${index === 0 ? 'active' : ''}`}
                        aria-label={`跳转到第 ${index + 1} 张幻灯片`}
                      ></button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 主内容区 */}
      <main className="flex-grow py-8">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 文章列表 */}
            <div className="col-span-1 lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">最新文章</h2>
                <Link
                  href="/posts"
                  className="inline-flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
                >
                  查看全部
                  <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </Link>
              </div>

              <div className="space-y-6">
                {recentPosts.map((post) => (
                  <article
                    key={post.id}
                    className="article-card"
                  >
                    <div className="md:flex">
                      {post.coverImage && (
                        <div className="md:flex-shrink-0">
                          <Link href={`/posts/${post.slug}`}>
                            <div className="h-52 md:h-full md:w-56 relative">
                              <Image
                                src={post.coverImage}
                                alt={String(post.title)}
                                fill
                                className="object-cover"
                              />
                            </div>
                          </Link>
                        </div>
                      )}
                      <div className="article-content">
                        <div className="flex items-center mb-2">
                          {post.pinned === 1 && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100 mr-2">
                              置顶
                            </span>
                          )}
                          {post.category && (
                            <Link
                              href={`/categories/${post.category.slug}`}
                              className="inline-block px-2.5 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs rounded font-medium hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                            >
                              {post.category.name}
                            </Link>
                          )}
                          <time className="text-xs text-gray-500 dark:text-gray-400 ml-auto" dateTime={new Date(post.createdAt || '').toISOString()}>
                            {post.createdAt ? formatDate(post.createdAt) : '未知日期'}
                          </time>
                        </div>

                        <Link href={`/posts/${post.slug}`}>
                          <h3 className="article-title">
                            {String(post.title)}
                          </h3>
                        </Link>

                        <p className="article-excerpt">
                          {post.excerpt}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {post.author?.email ? post.author.email.split('@')[0] : '匿名'}
                          </div>

                          <Link
                            href={`/posts/${post.slug}`}
                            className="inline-flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium"
                          >
                            阅读全文
                            <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                            </svg>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <div className="mt-8 text-center">
                <Link
                  href="/posts"
                  className="btn btn-primary"
                >
                  查看更多文章
                  <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </Link>
              </div>
            </div>

            {/* 侧边栏 */}
            <Sidebar categories={categories} tags={tags} />
          </div>
        </div>
      </main>

      {/* 页脚 */}
      <Footer />
    </div>
  );
}
