'use client';

import Link from 'next/link';
import Image from 'next/image';
import { formatDate } from '@/lib/utils';

type Post = {
  id: number;
  title: string;
  slug: string;
  excerpt?: string | null;
  coverImage?: string | null;
  createdAt?: string | null;
  category?: {
    id?: number;
    name?: string;
    slug?: string;
  } | null;
  authorEmail?: string | null;
  tags?: {
    id?: number;
    name?: string;
    slug?: string;
  }[] | null;
};

type LatestArticlesProps = {
  posts: Post[];
  title?: string;
  showPagination?: boolean;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  className?: string;
};

export default function LatestArticles({
  posts,
  title = '最新文章',
  showPagination = false,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  className = ''
}: LatestArticlesProps) {
  if (!posts || posts.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <p className="text-gray-600 dark:text-gray-400">暂无文章</p>
      </div>
    );
  }

  return (
    <section className={className}>
      {title && (
        <h2 className="text-2xl font-serif font-bold mb-6 pb-2 border-b border-gray-200 dark:border-gray-700">
          {title}
        </h2>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        {posts.map((post, index) => (
          <Link key={`latest-article-${post.id}`} href={`/posts/${post.slug}`} className="block group">
            <article
              className={`flex flex-col sm:flex-row gap-5 hover:bg-gray-50 dark:hover:bg-gray-700/50 p-2 -mx-2 rounded-lg transition-colors ${
                index !== posts.length - 1 ? 'mb-8 pb-8 border-b border-gray-100 dark:border-gray-700' : ''
              }`}
            >
              {post.coverImage ? (
                <div className="sm:w-1/5 flex-shrink-0">
                  <div className="relative h-32 sm:h-24 overflow-hidden rounded-md">
                    <Image
                      src={post.coverImage || '/images/default-thumbnail.png'}
                      alt={post.title}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
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
                    {post.createdAt ? formatDate(post.createdAt) : ''}
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

        <div className="mt-6 text-center">
          <Link
            href="/posts"
            className="inline-flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
          >
            查看所有文章
            <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </div>

      {/* 分页 */}
      {showPagination && totalPages > 1 && (
        <div className="flex justify-center mt-8 pt-4 border-t border-gray-100 dark:border-gray-700">
          <nav className="flex items-center space-x-2">
            <button
              onClick={() => onPageChange && onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded-md ${
                currentPage === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                  : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              上一页
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => onPageChange && onPageChange(pageNum)}
                className={`px-3 py-1 rounded-md ${
                  pageNum === currentPage
                    ? 'bg-primary-600 text-white dark:bg-primary-500'
                    : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                {pageNum}
              </button>
            ))}

            <button
              onClick={() => onPageChange && onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded-md ${
                currentPage === totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                  : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              下一页
            </button>
          </nav>
        </div>
      )}
    </section>
  );
}
