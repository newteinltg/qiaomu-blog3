import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Tag,
  FolderTree,
  Settings,
  Users,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  exact?: boolean;
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const navItems: NavItem[] = [
    {
      href: '/admin',
      label: '仪表盘',
      icon: <LayoutDashboard className="h-4 w-4" />,
      exact: true,
    },
    {
      href: '/admin/posts',
      label: '文章管理',
      icon: <FileText className="h-4 w-4" />,
    },
    {
      href: '/admin/categories',
      label: '分类管理',
      icon: <FolderTree className="h-4 w-4" />,
    },
    {
      href: '/admin/tags',
      label: '标签管理',
      icon: <Tag className="h-4 w-4" />,
    },
    {
      href: '/admin/settings',
      label: '网站设置',
      icon: <Settings className="h-4 w-4" />,
    },
    {
      href: '/admin/users',
      label: '用户管理',
      icon: <Users className="h-4 w-4" />,
    },
  ];

  // 处理登出
  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
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
    <div className="flex h-full flex-col border-r bg-background">
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid items-start px-2 text-sm font-medium">
          {navItems.map((item, index) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <Link
                key={index}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 transition-all',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="mt-auto p-4">
        <Separator className="my-2" />
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
        >
          <LogOut className="h-4 w-4" />
          <span>退出登录</span>
        </button>
      </div>
    </div>
  );
}
