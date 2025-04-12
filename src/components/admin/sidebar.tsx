import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Tag,
  FolderOpen,
  Settings,
  LogOut,
  Menu
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

const sidebarItems = [
  {
    title: '仪表盘',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: '文章',
    href: '/admin/posts',
    icon: FileText,
  },
  {
    title: '分类',
    href: '/admin/categories',
    icon: FolderOpen,
  },
  {
    title: '标签',
    href: '/admin/tags',
    icon: Tag,
  },
  {
    title: '菜单',
    href: '/admin/menus',
    icon: Menu,
  },
  {
    title: '设置',
    href: '/admin/settings',
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-background">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/admin" className="flex items-center gap-2 font-semibold">
          <FileText className="h-5 w-5" />
          <span>博客管理系统</span>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid items-start px-2 text-sm">
          {sidebarItems.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                (pathname === item.href || pathname.startsWith(item.href + '/')) && "bg-accent text-primary"
              )}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.title}</span>
            </Link>
          ))}
        </nav>
      </div>
      <div className="mt-auto p-4">
        <Separator className="my-2" />
        <Link
          href="/api/logout"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
        >
          <LogOut className="h-4 w-4" />
          <span>退出登录</span>
        </Link>
      </div>
    </div>
  );
}
