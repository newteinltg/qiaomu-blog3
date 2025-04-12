'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface EditPostLinkProps {
  postId: number;
}

export default function EditPostLink({ postId }: EditPostLinkProps) {
  const { data: session } = useSession();

  // 如果用户未登录，不显示编辑链接
  if (!session?.user) {
    return null;
  }

  return (
    <Link 
      href={`/admin/posts/edit/${postId}`}
      className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 ml-2"
    >
      编辑
    </Link>
  );
}
