'use client';

import { useEffect, useState } from 'react';
import FloatingInfoBar from './FloatingInfoBar';
import { useSettings } from '@/hooks/useSettings';

interface HtmlPageLayoutProps {
  title: string;
  content: string;
  returnUrl?: string;
  categories?: { id: number; name: string; slug: string }[];
  tags?: { id: number; name: string; slug: string }[];
}

export default function HtmlPageLayout({ title, content, returnUrl = '/', categories = [], tags = [] }: HtmlPageLayoutProps) {
  const { settings, loading } = useSettings();
  const [siteName, setSiteName] = useState('个人博客');

  // 移除信息栏状态的检查，始终显示信息栏

  // 当设置加载完成后更新站点名称
  useEffect(() => {
    if (!loading && settings?.siteName) {
      setSiteName(settings.siteName);
    }
  }, [settings, loading]);

  // 使用iframe加载HTML内容，确保JavaScript可以正常执行
  useEffect(() => {
    // 获取iframe元素
    const iframe = document.getElementById('html-content-iframe') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      // 写入HTML内容，不添加自定义样式，保持原始内容
      iframe.contentWindow.document.open();
      iframe.contentWindow.document.write(content);
      iframe.contentWindow.document.close();

      // 调整iframe高度以适应内容
      const resizeIframe = () => {
        if (iframe.contentWindow && iframe.contentWindow.document.body) {
          const height = iframe.contentWindow.document.body.scrollHeight;
          iframe.style.height = height + 'px';
        }
      };

      // 在内容加载完成后调整高度
      iframe.onload = resizeIframe;

      // 定期检查高度变化
      const heightInterval = setInterval(resizeIframe, 1000);

      return () => {
        clearInterval(heightInterval);
        if (iframe.contentWindow) {
          iframe.contentWindow.document.open();
          iframe.contentWindow.document.write('');
          iframe.contentWindow.document.close();
        }
      };
    }
  }, [content]);

  // 移除显示信息栏的功能，因为我们始终显示信息栏

  return (
    <div className="min-h-screen">
      {/* HTML内容容器 - 使用iframe */}
      <iframe
        id="html-content-iframe"
        className="w-full border-0"
        style={{ minHeight: '100vh' }}
        title={title}
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-top-navigation"
      ></iframe>

      {/* 底部信息栏 - 传递分类和标签信息 */}
      <FloatingInfoBar
        title={title}
        siteName={siteName}
        returnUrl={returnUrl}
        categories={categories}
        tags={tags}
      />
    </div>
  );
}
