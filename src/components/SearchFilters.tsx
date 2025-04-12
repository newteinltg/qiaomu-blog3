'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

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

interface SearchFiltersProps {
  categories: Category[];
  tags: Tag[];
  selectedCategory?: string;
  selectedTag?: string;
}

export default function SearchFilters({ 
  categories, 
  tags, 
  selectedCategory, 
  selectedTag 
}: SearchFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const query = searchParams.get('q') || '';
  const categoryId = searchParams.get('category') || selectedCategory || '';
  const tagId = searchParams.get('tag') || selectedTag || '';

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    updateSearch(query, value, tagId);
  };

  const handleTagChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    updateSearch(query, categoryId, value);
  };

  const updateSearch = (q: string, category: string, tag: string) => {
    const params = new URLSearchParams();
    
    if (q) params.set('q', q);
    if (category) params.set('category', category);
    if (tag) params.set('tag', tag);
    
    router.push(`/search?${params.toString()}`);
  };

  const clearFilters = () => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium">搜索过滤器</h2>
        <button
          onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
        >
          {isFiltersOpen ? '收起过滤器' : '展开过滤器'}
        </button>
      </div>
      
      {isFiltersOpen && (
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
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
          
          {(categoryId || tagId) && (
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
