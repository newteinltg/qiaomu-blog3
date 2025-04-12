'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from './ThemeToggle';

type MenuItem = {
  id: number;
  name: string;
  url: string;
  is_external: number;
  parent_id: number | null;
  sort_order: number;
  is_active: number;
  children?: MenuItem[];
};

interface NavigationProps {
  siteTitle?: string;
}

export default function Navigation({ siteTitle = '向阳乔木的个人博客' }: NavigationProps) {
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const response = await fetch('/api/menus');
        if (!response.ok) {
          throw new Error('Failed to fetch menus');
        }
        const data = await response.json();

        // 构建菜单树结构
        const menuTree = buildMenuTree(data);
        setMenus(menuTree);
      } catch (error) {
        console.error('Error fetching menus:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMenus();
  }, []);

  // 构建菜单树结构的函数
  const buildMenuTree = (menuItems: MenuItem[]): MenuItem[] => {
    const itemMap: Record<number, MenuItem> = {};
    const rootItems: MenuItem[] = [];

    // 首先创建所有项的映射
    menuItems.forEach(item => {
      itemMap[item.id] = { ...item, children: [] };
    });

    // 然后构建树结构
    menuItems.forEach(item => {
      if (item.parent_id === null) {
        rootItems.push(itemMap[item.id]);
      } else if (itemMap[item.parent_id]) {
        itemMap[item.parent_id].children = itemMap[item.parent_id].children || [];
        itemMap[item.parent_id].children!.push(itemMap[item.id]);
      }
    });

    // 对每个级别的菜单按 sort_order 排序
    const sortMenuItems = (items: MenuItem[]): MenuItem[] => {
      items.sort((a, b) => a.sort_order - b.sort_order);
      items.forEach(item => {
        if (item.children && item.children.length > 0) {
          item.children = sortMenuItems(item.children);
        }
      });
      return items;
    };

    return sortMenuItems(rootItems);
  };

  // 渲染菜单项
  const renderMenuItem = (item: MenuItem, isMobile = false) => {
    const isActive = pathname === item.url;
    const hasChildren = item.children && item.children.length > 0;

    const linkClasses = `
      ${isMobile
        ? 'block py-2 px-4 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors'
        : 'inline-flex items-center px-3 py-2 text-sm font-medium transition-colors hover:text-primary-600 dark:hover:text-primary-400'
      }
      ${isActive ? 'text-primary-600 dark:text-primary-400 font-semibold' : ''}
    `;

    if (item.is_external) {
      return (
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClasses}
        >
          {item.name}
          <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
          </svg>
        </a>
      );
    }

    if (hasChildren) {
      return (
        <div className={isMobile ? 'py-1' : 'relative group'}>
          <button className={`${linkClasses} flex items-center`}>
            {item.name}
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>
          <div className={`
            ${isMobile
              ? 'pl-4 mt-1 space-y-1'
              : 'absolute left-0 z-10 mt-2 w-48 origin-top-left rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none hidden group-hover:block'
            }
          `}>
            {item.children!.map((child) => (
              <div key={child.id}>
                {renderMenuItem(child, isMobile)}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <Link href={item.url} className={linkClasses}>
        {item.name}
      </Link>
    );
  };

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold">
                  向
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">{siteTitle}</span>
              </div>
            </Link>
          </div>

          {/* 桌面端菜单 */}
          <div className="hidden md:flex items-center space-x-4">
            {!isLoading && menus.map((item) => (
              <div key={item.id} className="relative">
                {renderMenuItem(item)}
              </div>
            ))}
            <ThemeToggle />
          </div>

          {/* 移动端菜单按钮 */}
          <div className="flex items-center md:hidden">
            <ThemeToggle />
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="ml-2 p-2 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none transition-colors"
              aria-expanded={isMobileMenuOpen}
              aria-label="打开主菜单"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 移动端菜单 */}
      <div
        className={`md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg transition-all duration-300 ease-in-out ${
          isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
        }`}
      >
        <div className="px-2 pt-2 pb-3 space-y-1">
          {!isLoading && menus.map((item) => (
            <div key={item.id} className="py-1">
              {renderMenuItem(item, true)}
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
}
