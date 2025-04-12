'use client';

import Link from 'next/link';
import Image from 'next/image';

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  parentId: number | null;
  order: number;
  postCount?: number;
}

interface Tag {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
}

interface Post {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  createdAt: string;
}

interface ContactInfo {
  id: number;
  type: string;
  name: string;
  qrCodeUrl: string;
}

interface ClientSidebarProps {
  categories: Category[];
  tags: Tag[];
  recentPosts: Post[];
  contactInfo: ContactInfo | null;
  showCategories?: boolean;
  showRecentPosts?: boolean;
  showPopularTags?: boolean;
}

export default function ClientSidebar({
  categories,
  tags,
  recentPosts,
  contactInfo,
  showCategories = true,
  showRecentPosts = true,
  showPopularTags = true,
}: ClientSidebarProps) {
  // 对分类按照文章数量排序
  const sortedCategories = [...categories].sort((a, b) => {
    return (b.postCount || 0) - (a.postCount || 0);
  });

  // 对标签按照字母顺序排序
  const sortedTags = [...tags].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-6">
      {/* 分类列表 */}
      {showCategories && categories.length > 0 && (
        <div className="sidebar-section bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <h3 className="sidebar-title text-lg font-bold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-100 dark:border-gray-700">分类</h3>
          <ul className="space-y-2">
            {sortedCategories.map((category) => (
              <li key={category.id}>
                <Link
                  href={`/categories/${category.slug}`}
                  className="flex items-center justify-between text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                >
                  <span>{category.name}</span>
                  {category.postCount !== undefined && (
                    <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full">
                      {category.postCount}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 最近文章 */}
      {showRecentPosts && recentPosts.length > 0 && (
        <div className="sidebar-section bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <h3 className="sidebar-title text-lg font-bold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-100 dark:border-gray-700">最新文章</h3>
          <div className="space-y-4">
            {recentPosts.map((post) => (
              <div key={post.id} className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-16 h-16 mt-1">
                  {post.coverImage ? (
                    <Image
                      src={post.coverImage}
                      alt={post.title}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    <Image
                      src="/images/default-thumbnail.png"
                      alt={post.title}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover rounded"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/posts/${post.slug}`}
                    className="text-sm font-medium text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 line-clamp-2"
                  >
                    {post.title}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 热门标签 */}
      {showPopularTags && tags.length > 0 && (
        <div className="sidebar-section bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <h3 className="sidebar-title text-lg font-bold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-100 dark:border-gray-700">热门标签</h3>
          <div className="flex flex-wrap gap-2">
            {sortedTags.map((tag) => (
              <Link
                key={tag.id}
                href={`/tags/${tag.slug}`}
                className="inline-block px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full hover:bg-primary-100 dark:hover:bg-primary-900 hover:text-primary-600 dark:hover:text-primary-400"
              >
                {tag.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 公众号 */}
      {contactInfo && contactInfo.qrCodeUrl && (
        <div className="sidebar-section bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <h3 className="sidebar-title text-lg font-bold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-100 dark:border-gray-700">公众号</h3>
          <div className="flex flex-col items-center">
            <Image
              src={contactInfo.qrCodeUrl || "/images/default-qrcode.png"}
              alt="公众号二维码"
              width={240}
              height={240}
              className="w-60 h-60 object-contain rounded-lg"
            />
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">扫码关注公众号</p>
          </div>
        </div>
      )}
    </div>
  );
}
