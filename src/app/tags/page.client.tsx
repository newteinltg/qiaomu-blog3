'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

interface Tag {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  postCount: number;
}

interface Pagination {
  page: number;
  pageSize: number;
  totalTags: number;
  totalPages: number;
}

interface TagsResponse {
  tags: Tag[];
  pagination: Pagination;
}

interface TagsClientProps {
  initialPage: number;
}

export default function TagsClient({ initialPage }: TagsClientProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TagsResponse | null>(null);
  const [page, setPage] = useState(initialPage);

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const fetchTags = async () => {
      setLoading(true);
      setError(null);

      try {
        // 构建API请求参数
        const params = new URLSearchParams();
        params.set('page', page.toString());
        params.set('pageSize', '50'); // 每页显示50个标签
        params.set('_t', Date.now().toString()); // 防止缓存

        const response = await fetch(`/api/tags/all?${params.toString()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });

        if (!response.ok) {
          throw new Error(`获取标签失败: ${response.statusText}`);
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error('获取标签出错:', err);
        setError(err instanceof Error ? err.message : '获取标签时发生未知错误');
      } finally {
        setLoading(false);
      }
    };

    fetchTags();
  }, [page]);

  // 处理页码变化
  const handlePageChange = (newPage: number) => {
    setPage(newPage);

    // 更新URL参数
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());

    router.push(`/tags?${params.toString()}`);

    // 滚动到页面顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden mt-0">
      <div className="p-6 mb-4 border-b border-gray-100 dark:border-gray-700">
        <h1 className="text-2xl font-bold mb-2">所有标签</h1>
        <p className="text-gray-600 dark:text-gray-400">
          {loading ? '正在加载...' : data?.pagination?.totalTags && data.pagination.totalTags > 0
            ? `共 ${data.pagination.totalTags} 个标签`
            : '暂无标签'}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : error ? (
        <div className="p-6">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
            <h2 className="text-xl font-medium text-red-800 dark:text-red-400 mb-2">错误</h2>
            <p className="text-red-600 dark:text-red-300">{error}</p>
          </div>
        </div>
      ) : !data || !data.tags || data.tags.length === 0 ? (
        <div className="p-6">
          <div className="text-center py-8">
            <h2 className="text-xl font-medium mb-2">暂无标签</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              博客中暂时没有创建任何标签。
            </p>
          </div>
        </div>
      ) : (
        <div className="p-6">
          {/* 标签列表 */}
          <div className="flex flex-wrap gap-3">
            {data.tags.map((tag) => (
              <Link 
                key={tag.id} 
                href={`/tags/${tag.slug}`}
                className="tag-item flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                <span className="text-gray-800 dark:text-gray-200">{tag.name}</span>
                <span className="ml-2 bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 text-xs px-2 py-1 rounded-full">
                  {tag.postCount}
                </span>
              </Link>
            ))}
          </div>

          {/* 分页 */}
          {data.pagination && data.pagination.totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <nav className="inline-flex rounded-md shadow">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className={`px-4 py-2 text-sm font-medium rounded-l-md ${
                    page === 1
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  } border border-gray-200 dark:border-gray-700`}
                >
                  上一页
                </button>
                
                {Array.from({ length: data.pagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-4 py-2 text-sm font-medium ${
                      pageNum === page
                        ? 'bg-primary-600 text-white hover:bg-primary-700'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    } border-t border-b border-gray-200 dark:border-gray-700`}
                  >
                    {pageNum}
                  </button>
                ))}
                
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === data.pagination.totalPages}
                  className={`px-4 py-2 text-sm font-medium rounded-r-md ${
                    page === data.pagination.totalPages
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  } border border-gray-200 dark:border-gray-700`}
                >
                  下一页
                </button>
              </nav>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
