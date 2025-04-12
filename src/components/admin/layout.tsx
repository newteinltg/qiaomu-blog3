'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Toaster } from '@/components/ui/toaster';
import { Link } from '@/components/ui/link';
import { Button } from '@/components/ui/button';
import { 
  HomeIcon, 
  DocumentTextIcon, 
  TagIcon, 
  Cog6ToothIcon, 
  ArrowTopRightOnSquareIcon,
  ArrowRightOnRectangleIcon,
  FolderIcon,
  Bars3Icon
} from '@/components/ui/icons';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  
  // 获取当前页面标题
  const getPageTitle = () => {
    const path = pathname?.split('/').filter(Boolean);
    
    if (!path || path.length === 1) return '仪表盘';
    
    const pageTitles: Record<string, string> = {
      'posts': '文章管理',
      'categories': '分类管理',
      'tags': '标签管理',
      'menus': '菜单管理',
      'settings': '系统设置',
    };
    
    return pageTitles[path[1]] || '仪表盘';
  };
  
  // 处理登出
  const handleLogout = async () => {
    try {
      const response = await fetch('/api/logout');
      const data = await response.json();
      if (data.success) {
        router.push('/login');
      } else {
        // 如果登出失败，也重定向到登录页
        router.push('/login');
      }
    } catch (error) {
      // 静默处理错误，直接重定向到登录页
      router.push('/login');
    }
  };
  
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-4">
          <h1 className="text-xl font-bold">博客管理</h1>
        </div>
        <nav className="flex-1 overflow-y-auto">
          <ul className="space-y-1 px-2">
            <li>
              <Link
                href="/admin"
                className={`flex items-center px-4 py-2 text-sm rounded-md ${
                  pathname === '/admin' ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <HomeIcon className="mr-3 h-5 w-5" />
                控制台
              </Link>
            </li>
            <li>
              <Link
                href="/admin/posts"
                className={`flex items-center px-4 py-2 text-sm rounded-md ${
                  pathname.startsWith('/admin/posts') ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <DocumentTextIcon className="mr-3 h-5 w-5" />
                文章管理
              </Link>
            </li>
            <li>
              <Link
                href="/admin/categories"
                className={`flex items-center px-4 py-2 text-sm rounded-md ${
                  pathname.startsWith('/admin/categories') ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <FolderIcon className="mr-3 h-5 w-5" />
                分类管理
              </Link>
            </li>
            <li>
              <Link
                href="/admin/tags"
                className={`flex items-center px-4 py-2 text-sm rounded-md ${
                  pathname.startsWith('/admin/tags') ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <TagIcon className="mr-3 h-5 w-5" />
                标签管理
              </Link>
            </li>
            <li>
              <Link
                href="/admin/menus"
                className={`flex items-center px-4 py-2 text-sm rounded-md ${
                  pathname.startsWith('/admin/menus') ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <Bars3Icon className="mr-3 h-5 w-5" />
                菜单管理
              </Link>
            </li>
            <li>
              <Link
                href="/admin/settings"
                className={`flex items-center px-4 py-2 text-sm rounded-md ${
                  pathname === '/admin/settings' ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <Cog6ToothIcon className="mr-3 h-5 w-5" />
                网站设置
              </Link>
            </li>
          </ul>
        </nav>
        
        {/* 底部操作按钮 */}
        <div className="p-4 border-t border-gray-800">
          <ul className="space-y-2">
            <li>
              <Link
                href="/"
                target="_blank"
                className="flex items-center px-4 py-2 text-sm rounded-md text-gray-300 hover:bg-gray-700"
              >
                <ArrowTopRightOnSquareIcon className="mr-3 h-5 w-5" />
                查看网站
              </Link>
            </li>
            <li>
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 text-sm rounded-md text-gray-300 hover:bg-gray-700 w-full text-left"
              >
                <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5" />
                退出登录
              </button>
            </li>
          </ul>
        </div>
      </aside>
      
      <div className="flex flex-1 flex-col admin-content">
        {/* 移除顶部标题，因为每个模块下面都有标题，提高空间利用率 */}
        <main className="flex-1 p-6">
          {children}
        </main>
        <Toaster />
      </div>
    </div>
  );
}
