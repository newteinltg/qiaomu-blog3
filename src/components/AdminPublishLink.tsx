'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { PenLine } from 'lucide-react';

interface AdminPublishLinkProps {
  isMobile?: boolean;
}

export default function AdminPublishLink({ isMobile = false }: AdminPublishLinkProps) {
  const { data: session } = useSession();

  // 如果用户未登录，不显示发布链接
  if (!session?.user) {
    return null;
  }

  if (isMobile) {
    return (
      <Link
        href="/admin/posts/new"
        className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
      >
        <PenLine className="h-4 w-4 mr-2" />
        <span>发布文章</span>
      </Link>
    );
  }

  return (
    <Link 
      href="/admin/posts/new"
      className="nav-link flex items-center text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
      title="发布文章"
    >
      <PenLine className="h-5 w-5" />
    </Link>
  );
}
