'use client';

import { useEffect, useState } from 'react';
import FloatingInfoBar from './FloatingInfoBar';
import { useSettings } from '@/hooks/useSettings';
import { sanitizeHtml } from '@/utils/html-sanitizer';

interface HtmlPageLayoutProps {
  title?: string;
  content: string;
  returnUrl?: string;
  categories?: { id: number; name: string; slug: string }[];
  tags?: { id: number; name: string; slug: string }[];
  postId?: number;
}

export default function HtmlPageLayout({ title, content, returnUrl = '/', categories = [], tags = [], postId }: HtmlPageLayoutProps) {
  const { settings, loading } = useSettings();
  const [siteName, setSiteName] = useState('个人博客');
  const [sanitizedContent, setSanitizedContent] = useState('');

  // 当设置加载完成后更新站点名称
  useEffect(() => {
    if (!loading && settings?.siteName) {
      setSiteName(settings.siteName);
    }
  }, [settings, loading]);

  // 清理HTML内容
  useEffect(() => {
    if (content) {
      // 使用sanitizeHtml函数清理内容
      const cleaned = sanitizeHtml(content);
      setSanitizedContent(cleaned);
    }
  }, [content]);

  // 直接使用dangerouslySetInnerHTML渲染HTML内容
  return (
    <div className="min-h-screen">
      <div 
        className="w-full min-h-screen" 
        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
      />
      
      {/* 底部信息栏 - 传递分类和标签信息 */}
      <FloatingInfoBar
        title={title || ''}
        siteName={siteName}
        returnUrl={returnUrl}
        categories={categories}
        tags={tags}
        postId={postId}
      />
    </div>
  );
}
