import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header() {
  const pathname = usePathname();
  
  // Get the current page title based on the pathname
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

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
      <div className="flex flex-1 items-center gap-4">
        <h1 className="text-xl font-semibold">{getPageTitle()}</h1>
      </div>
      <div className="flex items-center gap-4">
        <Link href="/" target="_blank">
          <Button variant="outline" size="sm">
            查看网站
          </Button>
        </Link>
        <Link href="/api/logout">
          <Button variant="ghost" size="icon" className="rounded-full" title="退出登录">
            <LogOut className="h-5 w-5" />
            <span className="sr-only">退出登录</span>
          </Button>
        </Link>
      </div>
    </header>
  );
}
