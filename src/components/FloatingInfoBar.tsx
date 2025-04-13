'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronUp, ChevronDown, Home, ArrowLeft, X, Edit } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface FloatingInfoBarProps {
  title: string;
  siteName: string;
  returnUrl?: string;
  categories?: { id: number; name: string; slug: string }[];
  tags?: { id: number; name: string; slug: string }[];
  postId?: number; 
}

export default function FloatingInfoBar({ title, siteName, returnUrl = '/', categories = [], tags = [], postId }: FloatingInfoBarProps) {
  const [isVisible, setIsVisible] = useState(true);
  const { data: session } = useSession(); 

  // 关闭信息栏
  const closeInfoBar = () => {
    setIsVisible(false);
  };

  // 如果信息栏不可见，则不渲染
  if (!isVisible) {
    return null;
  }

  // 截取标题，最多25个字
  const truncatedTitle = title.length > 25 ? title.substring(0, 25) + '...' : title;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out"
      style={{
        boxShadow: '0 -1px 3px rgba(0, 0, 0, 0.1)', 
        opacity: 0.75 
      }}
    >
      {/* 信息栏 - 透明底部悬浮条 */}
      <div className="bg-gray-800 text-white px-4 py-2 flex flex-wrap items-center justify-between">
        <div className="flex flex-wrap items-center mr-4 max-w-[60%] sm:max-w-[70%]">
          <span className="font-medium text-sm mr-2">{truncatedTitle}</span>

          {/* 分类信息 */}
          {categories.length > 0 && (
            <div className="flex items-center mr-2">
              <span className="text-gray-400 text-xs mr-1">分类:</span>
              <div className="flex flex-wrap">
                {categories.map((category, index) => (
                  <span key={category.id} className="text-xs text-blue-300 mr-1">
                    {category.name}{index < categories.length - 1 ? ',' : ''}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 标签信息 */}
          {tags.length > 0 && (
            <div className="flex items-center">
              <span className="text-gray-400 text-xs mr-1">标签:</span>
              <div className="flex flex-wrap">
                {tags.map((tag, index) => (
                  <span key={tag.id} className="text-xs text-green-300 mr-1">
                    {tag.name}{index < tags.length - 1 ? ',' : ''}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* 管理员编辑按钮 - 仅当用户登录且有postId时显示 */}
          {session?.user && postId && (
            <Link
              href={`/admin/posts/edit/${postId}`}
              className="inline-flex items-center px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded text-xs text-white transition-colors"
              title="编辑文章"
            >
              <Edit size={12} className="mr-1" />
              <span>编辑</span>
            </Link>
          )}

          <Link
            href="/"
            className="inline-flex items-center px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs text-white transition-colors"
          >
            <Home size={12} className="mr-1" />
            <span>首页</span>
          </Link>

          <Link
            href={returnUrl}
            className="inline-flex items-center px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs text-white transition-colors"
          >
            <ArrowLeft size={12} className="mr-1" />
            <span>返回</span>
          </Link>

          <button
            onClick={closeInfoBar}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
            title="关闭信息栏"
          >
            <X size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
