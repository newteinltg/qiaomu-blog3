import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  
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

  // 处理登出
  const handleLogout = async () => {
    try {
      const response = await fetch('/api/logout');
      const data = await response.json();
      if (data.success) {
        router.push('/login');
      }
    } catch (error) {
      // 静默处理错误，避免在Edge Runtime中使用console
      router.push('/login');
    }
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
        <Button 
          onClick={handleLogout} 
          variant="ghost" 
          size="icon" 
          className="rounded-full" 
          title="退出登录"
        >
          <LogOut className="h-5 w-5" />
          <span className="sr-only">退出登录</span>
        </Button>
      </div>
    </header>
  );
}
