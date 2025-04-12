'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

interface SearchBoxProps {
  isMobile?: boolean;
  onClose?: () => void;
}

export default function SearchBox({ isMobile = false, onClose }: SearchBoxProps) {
  const [query, setQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const searchBoxRef = useRef<HTMLDivElement>(null);

  // 处理搜索提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      // 构建搜索URL，包含查询参数
      const searchUrl = `/search?q=${encodeURIComponent(query.trim())}`;
      router.push(searchUrl);
      
      // 如果在移动端，关闭菜单
      if (isMobile && onClose) {
        onClose();
      }
      
      // 如果是展开的搜索框，收起它
      if (!isMobile) {
        setIsExpanded(false);
      }
    }
  };

  // 处理点击搜索图标
  const handleSearchIconClick = () => {
    if (!isMobile) {
      setIsExpanded(!isExpanded);
      // 如果展开，聚焦输入框
      if (!isExpanded && inputRef.current) {
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      }
    }
  };

  // 处理点击外部关闭搜索框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchBoxRef.current && 
        !searchBoxRef.current.contains(event.target as Node) && 
        isExpanded
      ) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);

  // 移动端搜索框样式
  if (isMobile) {
    return (
      <form onSubmit={handleSubmit} className="w-full px-4 py-2">
        <div className="relative flex items-center">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索文章..."
            className="w-full px-4 py-2 pl-10 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
            ref={inputRef}
          />
          <Search className="absolute left-3 h-5 w-5 text-gray-500 dark:text-gray-400" />
          <button
            type="submit"
            className="absolute right-3 px-2 py-1 text-sm bg-primary-500 text-white rounded-full hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            搜索
          </button>
        </div>
      </form>
    );
  }

  // 桌面端搜索框样式
  return (
    <div ref={searchBoxRef} className="relative">
      <button
        onClick={handleSearchIconClick}
        className="nav-link flex items-center"
        aria-label="搜索"
      >
        <Search className="h-5 w-5" />
      </button>
      
      {isExpanded && (
        <form
          onSubmit={handleSubmit}
          className="absolute right-0 top-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 z-50 w-64 border border-gray-200 dark:border-gray-700"
        >
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索文章..."
              className="w-full px-4 py-2 pl-10 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
              ref={inputRef}
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-500 dark:text-gray-400" />
            <button
              type="submit"
              className="absolute right-2 top-1.5 px-2 py-1 text-sm bg-primary-500 text-white rounded-full hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              搜索
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
