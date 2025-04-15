import Link from 'next/link';
import Image from 'next/image';
import { db } from '@/lib/db';
import * as schema from '@/lib/schema';
import { eq, desc, count, sql } from 'drizzle-orm';
import { getContactInfo } from '@/lib/services/settings';
import Avatar from './Avatar';

type Category = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  parentId: number | null;
  order: number;
  postCount?: number;
};

type Tag = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
};

type SidebarProps = {
  showCategories?: boolean;
  showRecentPosts?: boolean;
  showLatestPosts?: boolean;
  showPopularTags?: boolean;
  categories?: Category[];
  tags?: Tag[];
  isHomePage?: boolean;
};

export default async function Sidebar({
  showCategories = true,
  showRecentPosts = true,
  showLatestPosts = true,
  showPopularTags = true,
  categories: propCategories,
  tags: propTags,
  isHomePage = false
}: SidebarProps) {
  // 获取分类列表
  const categories = propCategories || (showCategories ? await db
    .select({
      id: schema.categories.id,
      name: schema.categories.name,
      slug: schema.categories.slug,
      postCount: count(schema.postCategories.postId)
    })
    .from(schema.categories)
    .leftJoin(schema.postCategories, eq(schema.categories.id, schema.postCategories.categoryId))
    .leftJoin(schema.posts, eq(schema.postCategories.postId, schema.posts.id))
    .where(eq(schema.posts.published, 1)) // 只计算已发布的文章
    .groupBy(schema.categories.id)
    .orderBy(schema.categories.name)
    .all() : []);

  // 获取最近文章
  const recentPosts = (showRecentPosts || showLatestPosts) ? await db
    .select({
      id: schema.posts.id,
      title: schema.posts.title,
      slug: schema.posts.slug,
      createdAt: schema.posts.createdAt,
      coverImage: schema.posts.coverImage,
    })
    .from(schema.posts)
    .where(eq(schema.posts.published, 1))
    .orderBy(desc(schema.posts.createdAt))
    .limit(5)
    .all() : [];

  // 获取热门标签
  const popularTags = propTags || (showPopularTags ? await db
    .select({
      id: schema.tags.id,
      name: schema.tags.name,
      slug: schema.tags.slug,
      postCount: count(schema.postTags.postId)
    })
    .from(schema.tags)
    .leftJoin(schema.postTags, eq(schema.tags.id, schema.postTags.tagId))
    .leftJoin(schema.posts, eq(schema.postTags.postId, schema.posts.id))
    .where(eq(schema.posts.published, 1)) // 只计算已发布的文章
    .groupBy(schema.tags.id)
    .orderBy(desc(count(schema.postTags.postId)))
    .limit(10)
    .all() : []);

  // 获取公众号信息
  const contactInfo = await getContactInfo();
  const officialAccount = contactInfo.find(contact => contact.type === 'public');

  return (
    <aside className="space-y-8">
      {/* 分类 */}
      {showCategories && categories.length > 0 && categories.some(category => category.postCount && category.postCount > 0) && (
        <div className="sidebar-section bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <h3 className="sidebar-title text-lg font-bold text-gray-900 dark:text-white mb-4">分类</h3>
          <div className="category-list">
            {categories.filter(category => category.postCount && category.postCount > 0).map(category => (
              <a
                key={category.id}
                href={`/categories/${category.slug}`}
                className="category flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700 last:border-0 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                <span>{category.name}</span>
                <span className="category-count text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full">
                  {category.postCount || 0}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* 最近文章 - 在首页不显示 */}
      {((showRecentPosts && !isHomePage) || showLatestPosts) && recentPosts.length > 0 && (
        <div className="sidebar-section bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <div className="relative mb-4 h-8">
            <h3 className="sidebar-title text-lg font-bold text-gray-900 dark:text-white">最新文章</h3>
            <Link 
              href="/posts" 
              className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors absolute"
              style={{ top: '4px', right: '0' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </Link>
          </div>

          <div className="space-y-4">
            {recentPosts.map(post => (
              <a href={`/posts/${post.slug}`} key={post.id} className="sidebar-article flex mb-4 pb-4 border-b border-gray-100 dark:border-gray-700 last:border-0 last:mb-0 last:pb-0">
                {post.coverImage && post.coverImage.trim() ? (
                  <img src={post.coverImage} alt={String(post.title)} className="sidebar-article-image w-16 h-16 rounded-lg object-cover mr-3 flex-shrink-0" />
                ) : (
                  <img src="/images/default-thumbnail.png" alt={String(post.title)} className="sidebar-article-image w-16 h-16 rounded-lg object-cover mr-3 flex-shrink-0" />
                )}
                <div className="sidebar-article-content flex-1">
                  <h4 className="sidebar-article-title text-sm font-medium text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 line-clamp-2 transition-colors mb-1">
                    {String(post.title)}
                  </h4>
                  <div className="sidebar-article-date text-xs text-gray-500 dark:text-gray-400">
                    {post.createdAt && new Date(post.createdAt).toLocaleDateString('zh-CN')}
                  </div>
                </div>
              </a>
            ))}
          </div>


        </div>
      )}

      {/* 公众号 */}
      <div className="sidebar-section bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
        <h3 className="sidebar-title text-lg font-bold text-gray-900 dark:text-white mb-4">公众号</h3>
        <div className="flex flex-col items-center">
          <Image
            src={officialAccount?.qrCodeUrl || "/images/default-qrcode.png"}
            alt="公众号二维码"
            width={240}
            height={240}
            className="w-60 h-60 object-contain rounded-lg"
          />
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">扫码关注公众号</p>
        </div>
      </div>

      {/* 热门标签 */}
      {showPopularTags && popularTags.length > 0 && (
        <div className="sidebar-section bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <div className="relative mb-4 h-8">
            <h3 className="sidebar-title text-lg font-bold text-gray-900 dark:text-white">热门标签</h3>
            <Link 
              href="/tags" 
              className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors absolute"
              style={{ top: '4px', right: '0' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </Link>
          </div>
          <div className="tag-list flex flex-wrap gap-2 max-h-[210px] overflow-hidden">
            {popularTags.map(tag => (
              <a
                key={tag.id}
                href={`/tags/${tag.slug}`}
                className="tag inline-block px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-md hover:bg-primary-100 dark:hover:bg-primary-900 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                {tag.name} {(tag as any).postCount ? `(${(tag as any).postCount})` : ''}
              </a>
            ))}
          </div>

        </div>
      )}
    </aside>
  );
}
