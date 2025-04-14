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
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: session } = useSession(); 

  // 关闭信息栏
  const closeInfoBar = () => {
    setIsVisible(false);
  };

  // 切换展开/收起状态
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // 如果信息栏不可见，则不渲染
  if (!isVisible) {
    return null;
  }

  // 截取标题，最多20个字
  const truncatedTitle = title.length > 20 ? title.substring(0, 20) + '...' : title;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out"
      style={{
        boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.15)', 
        opacity: 0.95,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)' // 适配iPhone X等底部安全区域
      }}
    >
      {/* 信息栏 - 透明底部悬浮条 */}
      <div className="bg-gray-800 text-white px-4 py-4 flex flex-col">
        {/* 主要信息行 - 始终显示 */}
        <div className="flex items-center justify-between">
          {/* 左侧：返回按钮和标题 */}
          <div className="flex items-center space-x-3">
            <Link href={returnUrl} className="text-white hover:text-gray-300">
              <ArrowLeft size={20} strokeWidth={2} />
            </Link>
            <h2 className="font-medium text-sm sm:text-base">{truncatedTitle}</h2>
          </div>

          {/* 右侧：控制按钮 */}
          <div className="flex items-center space-x-3">
            {/* 展开/收起按钮 */}
            <button 
              onClick={toggleExpand}
              className="p-2 rounded-full hover:bg-gray-700 transition-colors"
              aria-label={isExpanded ? "收起详情" : "展开详情"}
            >
              {isExpanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
            </button>

            {/* 编辑按钮 - 仅管理员可见 */}
            {session?.user && postId && (
              <Link href={`/admin/posts/edit/${postId}`} className="p-2 rounded-full hover:bg-gray-700 transition-colors">
                <Edit size={20} strokeWidth={2} />
              </Link>
            )}

            {/* 关闭按钮 */}
            <button 
              onClick={closeInfoBar}
              className="p-2 rounded-full hover:bg-gray-700 transition-colors"
              aria-label="关闭信息栏"
            >
              <X size={20} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* 扩展信息 - 仅在展开状态显示 */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-gray-700 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 分类信息 */}
            {categories && categories.length > 0 && (
              <div className="flex flex-wrap items-center">
                <span className="text-gray-400 text-xs mr-2">分类:</span>
                <div className="flex flex-wrap gap-1">
                  {categories.map((category, index) => (
                    category && category.slug ? (
                      <Link 
                        key={category.id || index} 
                        href={`/categories/${category.slug}`}
                        className="text-xs bg-gray-700 text-white px-2 py-1 rounded hover:bg-gray-600 transition-colors"
                      >
                        {category.name}
                      </Link>
                    ) : null
                  ))}
                </div>
              </div>
            )}

            {/* 标签信息 */}
            {tags && tags.length > 0 && (
              <div className="flex flex-wrap items-center">
                <span className="text-gray-400 text-xs mr-2">标签:</span>
                <div className="flex flex-wrap gap-1">
                  {tags.map((tag, index) => (
                    tag && tag.slug ? (
                      <Link 
                        key={tag.id || index} 
                        href={`/tags/${tag.slug}`}
                        className="text-xs bg-gray-700 text-white px-2 py-1 rounded hover:bg-gray-600 transition-colors"
                      >
                        {tag.name}
                      </Link>
                    ) : null
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
