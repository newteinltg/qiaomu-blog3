'use client';

import { useState } from 'react';
import Link from 'next/link';
import SearchBox from './SearchBox';
import ThemeToggle from './ThemeToggle';
import AdminPublishLink from './AdminPublishLink';

type MenuItem = {
  id: number;
  name: string;
  url: string;
  isExternal: number;
  parentId: number | null;
  order: number;
  isActive: number;
};

type SimpleMobileMenuProps = {
  menus: MenuItem[];
  onClose?: () => void; // 可选的关闭回调函数
};

export default function SimpleMobileMenu({ menus, onClose }: SimpleMobileMenuProps) {
  const [activeMenus, setActiveMenus] = useState<Record<string, boolean>>({});

  // 切换菜单的展开/折叠状态
  const toggleMenu = (menuId: string) => {
    setActiveMenus(prev => ({
      ...prev,
      [menuId]: !prev[menuId]
    }));

    // 添加调试日志
    console.log(`切换菜单: ${menuId}, 新状态: ${!activeMenus[menuId]}`);
  };

  // 获取一级菜单
  const topLevelMenus = menus.filter(menu => !menu.parentId);

  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-800 z-50 overflow-y-auto p-4">
      <div className="p-4 flex justify-between items-center border-b dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">菜单</h2>
        <button
          onClick={onClose}
          className="p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* 移动端搜索框 */}
      <div className="p-4 border-b dark:border-gray-700">
        <SearchBox isMobile={true} onClose={onClose} />
      </div>

      <nav className="space-y-2 p-4">
        {/* 首页链接 */}
        <Link
          href="/"
          className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
          onClick={onClose}
        >
          首页
        </Link>

        {/* 渲染一级菜单 */}
        {topLevelMenus.map(menu => {
          // 查找子菜单
          const subMenus = menus.filter(subMenu => subMenu.parentId === menu.id);
          const menuId = `menu-${menu.id}`;

          if (subMenus.length > 0) {
            return (
              <div key={menu.id} className="space-y-1">
                <button
                  className="flex items-center justify-between w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                  onClick={() => toggleMenu(menuId)}
                  data-testid={`menu-button-${menu.id}`}
                >
                  <span>{menu.name}</span>
                  <svg
                    className={`w-5 h-5 transition-transform ${activeMenus[menuId] ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* 子菜单容器 */}
                <div
                  className={`pl-4 ml-2 border-l-2 border-gray-200 dark:border-gray-700 space-y-1 overflow-hidden transition-all duration-300 ${
                    activeMenus[menuId] ? 'max-h-96' : 'max-h-0'
                  }`}
                  data-testid={`submenu-${menu.id}`}
                >
                  {subMenus.map(subMenu => {
                    // 查找三级菜单
                    const thirdLevelMenus = menus.filter(thirdMenu => thirdMenu.parentId === subMenu.id);
                    const subMenuId = `submenu-${subMenu.id}`;

                    if (thirdLevelMenus.length > 0) {
                      return (
                        <div key={subMenu.id} className="space-y-1 mt-1">
                          <button
                            className="flex items-center justify-between w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                            onClick={() => toggleMenu(subMenuId)}
                            data-testid={`submenu-button-${subMenu.id}`}
                          >
                            <span>{subMenu.name}</span>
                            <svg
                              className={`w-5 h-5 transition-transform ${activeMenus[subMenuId] ? 'rotate-180' : ''}`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>

                          {/* 三级菜单容器 */}
                          <div
                            className={`pl-4 ml-2 border-l-2 border-gray-200 dark:border-gray-700 space-y-1 overflow-hidden transition-all duration-300 ${
                              activeMenus[subMenuId] ? 'max-h-96' : 'max-h-0'
                            }`}
                            data-testid={`third-level-menu-${subMenu.id}`}
                          >
                            {thirdLevelMenus.map(thirdMenu => (
                              <Link
                                key={thirdMenu.id}
                                href={thirdMenu.url}
                                className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                                onClick={onClose}
                              >
                                {thirdMenu.name}
                              </Link>
                            ))}
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <Link
                          key={subMenu.id}
                          href={subMenu.url}
                          className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                          onClick={onClose}
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
            return (
              <Link
                key={menu.id}
                href={menu.url}
                className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                onClick={onClose}
              >
                {menu.name}
              </Link>
            );
          }
        })}

        {/* 移动端发布文章按钮 - 仅管理员可见 */}
        <AdminPublishLink isMobile={true} />

        {/* 移动端主题切换按钮 */}
        <ThemeToggle isMobile={true} />
      </nav>


    </div>
  );
}
