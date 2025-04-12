'use client';

import { useState } from 'react';
import Link from 'next/link';

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
};

export default function SimpleMobileMenu({ menus }: SimpleMobileMenuProps) {
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
      <div className="mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold">菜单</h2>
      </div>
      
      <nav className="space-y-2">
        {/* 首页链接 */}
        <Link 
          href="/" 
          className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
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
              >
                {menu.name}
              </Link>
            );
          }
        })}
      </nav>
      
      {/* 调试信息 */}
      <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-700 rounded-md text-sm">
        <h3 className="font-bold mb-2">调试信息</h3>
        <pre className="whitespace-pre-wrap">
          {JSON.stringify(activeMenus, null, 2)}
        </pre>
      </div>
    </div>
  );
}
