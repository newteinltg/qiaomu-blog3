'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface Tag {
  id: number;
  name: string;
  slug: string;
}

interface PostsFiltersProps {
  categories: Category[];
  tags: Tag[];
  selectedCategory?: string;
  selectedTag?: string;
  query?: string;
}

export default function PostsFilters({ 
  categories, 
  tags, 
  selectedCategory, 
  selectedTag,
  query
}: PostsFiltersProps) {
  const router = useRouter();
  const [isFiltersOpen, setIsFiltersOpen] = useState(true); // 默认展开过滤器
  const [searchQuery, setSearchQuery] = useState(query || '');
  const [categoryId, setCategoryId] = useState(selectedCategory || '');
  const [tagId, setTagId] = useState(selectedTag || '');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters(searchQuery, categoryId, tagId);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setCategoryId(value);
    updateFilters(searchQuery, value, tagId);
  };

  const handleTagChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setTagId(value);
    updateFilters(searchQuery, categoryId, value);
  };

  const updateFilters = (q: string, category: string, tag: string) => {
    const params = new URLSearchParams();
    
    if (q) params.set('q', q);
    if (category) params.set('category', category);
    if (tag) params.set('tag', tag);
    
    router.push(`/posts?${params.toString()}`);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setCategoryId('');
    setTagId('');
    router.push('/posts');
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium">文章过滤器</h2>
        <button
          onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
        >
          {isFiltersOpen ? '收起过滤器' : '展开过滤器'}
        </button>
      </div>
      
      {isFiltersOpen && (
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          {/* 搜索框 */}
          <form onSubmit={handleSearch} className="mb-4">
            <div className="flex">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索文章..."
                className="flex-1 p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-l-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 text-white rounded-r-md hover:bg-primary-700 transition-colors"
              >
                搜索
              </button>
            </div>
          </form>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                按分类筛选
              </label>
              <select
                id="category-filter"
                value={categoryId}
                onChange={handleCategoryChange}
                className="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">所有分类</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id.toString()}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="tag-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                按标签筛选
              </label>
              <select
                id="tag-filter"
                value={tagId}
                onChange={handleTagChange}
                className="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">所有标签</option>
                {tags.map((tag) => (
                  <option key={tag.id} value={tag.id.toString()}>
                    {tag.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {(searchQuery || categoryId || tagId) && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={clearFilters}
                className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                清除筛选条件
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
