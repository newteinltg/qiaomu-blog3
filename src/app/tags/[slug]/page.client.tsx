'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import LatestArticles from '@/components/LatestArticles';
import { formatDate } from '@/lib/utils';

interface Author {
  id: number;
  email: string;
  name: string;
}

interface Post {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  createdAt: string;
  author: Author | null;
  tags?: {
    id: number;
    name: string;
    slug: string;
  }[] | null;
  category?: {
    name: string;
  };
}

interface Tag {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
}

interface Pagination {
  page: number;
  pageSize: number;
  totalPosts: number;
  totalPages: number;
}

interface TagPostsResponse {
  tag: Tag;
  posts: Post[];
  pagination: Pagination;
}

export default function TagPostsClient() {
  const pathname = usePathname();
  const slug = pathname.split('/').pop() || '';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TagPostsResponse | null>(null);
  const [page, setPage] = useState(1);

  // 使用缓存来存储标签页面数据
  const cacheKey = `tag-${slug}-page-${page}`;
  const [cache, setCache] = useState<Record<string, TagPostsResponse>>({});

  useEffect(() => {
    const fetchPosts = async () => {
      // 如果缓存中有数据，直接使用缓存
      if (cache[cacheKey]) {
        setData(cache[cacheKey]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/tags/${slug}/posts?page=${page}&pageSize=10`, {
          // 添加缓存控制
          cache: 'force-cache'
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch tag posts: ${response.statusText}`);
        }

        const data = await response.json();
        // 确保数据有效
        const safeData = {
          tag: data.tag || { id: 0, name: '', slug: '', description: null, createdAt: '' },
          posts: Array.isArray(data.posts) ? data.posts : [],
          pagination: data.pagination || { page: 1, pageSize: 10, totalPosts: 0, totalPages: 1 }
        };

        // 更新缓存
        setCache(prevCache => ({
          ...prevCache,
          [cacheKey]: safeData
        }));

        setData(safeData);
      } catch (error) {
        console.error('Error fetching tag posts:', error);
        setError('Failed to fetch tag posts. Please try again later.');
        // 设置默认数据
        setData({
          tag: { id: 0, name: '', slug: '', description: null, createdAt: '' },
          posts: [],
          pagination: { page: 1, pageSize: 10, totalPosts: 0, totalPages: 1 }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [slug, page, cache, cacheKey]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
        <h2 className="text-xl font-medium text-red-800 dark:text-red-400 mb-2">Error</h2>
        <p className="text-red-600 dark:text-red-300">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
        <h2 className="text-xl font-medium mb-2">标签不存在</h2>
        <p className="text-gray-600 dark:text-gray-400">
          找不到请求的标签，请检查 URL 是否正确。
        </p>
      </div>
    );
  }

  const { tag, posts = [], pagination } = data;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden mt-0">
      <div className="p-6 mb-4 border-b border-gray-100 dark:border-gray-700">
        <h1 className="text-2xl font-bold mb-2">#{tag.name}</h1>
        {tag.description && (
          <p className="text-gray-600 dark:text-gray-400">{tag.description}</p>
        )}
      </div>

      {posts.length > 0 ? (
        <div className="p-6 space-y-6">
          <div className="space-y-0">
            {posts.map((post, index) => (
              <Link key={post.id} href={`/posts/${post.slug}`} className="block group">
                <article
                  className={`flex flex-col sm:flex-row gap-5 hover:bg-gray-50 dark:hover:bg-gray-700/50 p-2 -mx-2 rounded-lg transition-colors ${
                    index !== posts.length - 1 ? 'mb-8 pb-8 border-b border-gray-100 dark:border-gray-700' : ''
                  }`}
                >
                  {post.coverImage ? (
                    <div className="sm:w-1/5 flex-shrink-0">
                      <div className="relative h-32 sm:h-24 overflow-hidden rounded-md">
                        <img
                          src={post.coverImage || '/images/default-thumbnail.png'}
                          alt={post.title}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                      </div>
                    </div>
                  ) : null}

                  <div className={`flex-1 flex flex-col ${!post.coverImage ? 'sm:ml-0' : ''}`}>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2 mb-2">
                      {post.title}
                    </h3>

                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-3">
                      <span>
                        {formatDate(post.createdAt)}
                      </span>

                      {post.category?.name && (
                        <>
                          <span className="mx-2">·</span>
                          <span className="text-gray-500 dark:text-gray-400">
                            {post.category.name}
                          </span>
                        </>
                      )}
                    </div>

                    {/* 显示标签 */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-auto">
                        {post.tags.slice(0, 3).map((tag) => (
                          <span
                            key={`tag-${post.id}-${tag.id}`}
                            className="inline-block px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md"
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              </Link>
            ))}
          </div>

          {/* 分页 */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center mt-8 pt-4 border-t border-gray-100 dark:border-gray-700">
              <nav className="flex items-center space-x-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className={`px-3 py-1 rounded-md ${
                    page === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                      : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  上一页
                </button>

                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`px-3 py-1 rounded-md ${
                      pageNum === page
                        ? 'bg-primary-600 text-white dark:bg-primary-500'
                        : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}

                <button
                  onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                  disabled={page === pagination.totalPages}
                  className={`px-3 py-1 rounded-md ${
                    page === pagination.totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                      : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  下一页
                </button>
              </nav>
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 text-center">
          <h2 className="text-xl font-medium mb-2">暂无文章</h2>
          <p className="text-gray-600 dark:text-gray-400">
            该标签下暂时没有文章，请稍后再来查看。
          </p>
        </div>
      )}
    </div>
  );
}
