'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import SearchBox from './SearchBox';
import ThemeToggle from './ThemeToggle';
import AdminPublishLink from './AdminPublishLink';
import SimpleMobileMenu from './SimpleMobileMenu';

type MenuItem = {
  id: number;
  name: string;
  url: string;
  isExternal: number;
  parentId: number | null;
  order: number;
  isActive: number;
};

type SimpleNavigationProps = {
  siteTitle?: string;
  menus?: MenuItem[];
};

const SimpleNavigation = ({ siteTitle, menus = [] }: SimpleNavigationProps) => {
  // 调试输出菜单数据
  console.log('SimpleNavigation 接收到的菜单数据:', JSON.stringify(menus, null, 2));

  const [siteName, setSiteName] = useState(siteTitle || '向阳乔木的个人博客');

  // 从后台获取网站标题
  useEffect(() => {
    async function fetchSiteSettings() {
      try {
        const response = await fetch('/api/settings/general');
        if (response.ok) {
          const data = await response.json();
          if (data.siteName) {
            setSiteName(data.siteName);
          }
        }
      } catch (error) {
        console.error('获取网站设置失败:', error);
      }
    }

    fetchSiteSettings();
  }, []);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 调试输出菜单数据
  useEffect(() => {
    console.log('菜单数据:', JSON.stringify(menus, null, 2));
    console.log('菜单数量:', menus.length);
    console.log('顶级菜单数量:', menus.filter(menu => !menu.parentId).length);
  }, [menus]);

  return (
    <div>
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo - Left aligned */}
            <div className="flex-shrink-0">
              <Link href="/" className="site-logo text-2xl font-bold">{siteName}</Link>
            </div>

            {/* Desktop menu - Right aligned */}
            <div className="hidden md:flex md:items-center md:justify-end md:flex-1 md:space-x-4">
              <Link href="/" className="nav-link">首页</Link>

              {/* 菜单项 */}
              {menus.filter(menu => !menu.parentId).map(menu => {
                // 查找子菜单
                const subMenus = menus.filter(subMenu => subMenu.parentId === menu.id);

                if (subMenus.length > 0) {
                  return (
                    <div key={menu.id} className="dropdown !bg-transparent hover:!bg-transparent !px-1">
                      <button className="nav-link ">
                        {menu.name}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 ml-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      <div className="dropdown-menu">
                        {subMenus.map(subMenu => {
                          // 查找三级菜单
                          const thirdLevelMenus = menus.filter(thirdMenu => thirdMenu.parentId === subMenu.id);

                          if (thirdLevelMenus.length > 0) {
                            return (
                              <div key={subMenu.id} className="sub-dropdown">
                                <button className="dropdown-item flex items-center justify-between">
                                  {subMenu.name}
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4 ml-1"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </button>
                                <div className="sub-dropdown-menu">
                                  {thirdLevelMenus.map(thirdMenu => (
                                    thirdMenu.isExternal ? (
                                      <a
                                        key={thirdMenu.id}
                                        href={thirdMenu.url}
                                        className="dropdown-item"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        {thirdMenu.name}
                                      </a>
                                    ) : (
                                      <Link
                                        key={thirdMenu.id}
                                        href={thirdMenu.url}
                                        className="dropdown-item"
                                      >
                                        {thirdMenu.name}
                                      </Link>
                                    )
                                  ))}
                                </div>
                              </div>
                            );
                          } else {
                            return subMenu.isExternal ? (
                              <a
                                key={subMenu.id}
                                href={subMenu.url}
                                className="dropdown-item"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {subMenu.name}
                              </a>
                            ) : (
                              <Link
                                key={subMenu.id}
                                href={subMenu.url}
                                className="dropdown-item"
                              >
                                {subMenu.name}
                              </Link>
                            );
                          }
                        })}
                      </div>
                    </div>
                  );
                } else {
                  return menu.isExternal ? (
                    <a
                      key={menu.id}
                      href={menu.url}
                      className="nav-link"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {menu.name}
                    </a>
                  ) : (
                    <Link
                      key={menu.id}
                      href={menu.url}
                      className="nav-link"
                    >
                      {menu.name}
                    </Link>
                  );
                }
              })}

              {/* 搜索框 */}
              <SearchBox />

              {/* 发布文章按钮 - 仅管理员可见 */}
              <AdminPublishLink />

              {/* 主题切换按钮 */}
              <ThemeToggle />
            </div>

            {/* 移动端菜单按钮 */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {mobileMenuOpen ? (
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
      </header>

      {/* 移动端菜单 */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-gray-800 bg-opacity-75 transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="fixed inset-y-0 right-0 max-w-xs w-full bg-white dark:bg-gray-800 shadow-xl transition-transform transform translate-x-0"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 使用SimpleMobileMenu组件 */}
            <SimpleMobileMenu menus={menus} onClose={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleNavigation;
