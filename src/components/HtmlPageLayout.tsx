'use client';

import { useEffect, useState } from 'react';
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
  const [processedHtml, setProcessedHtml] = useState('');

  // 当设置加载完成后更新站点名称
  useEffect(() => {
    if (!loading && settings?.siteName) {
      setSiteName(settings.siteName);
    }
  }, [settings, loading]);

  // 处理HTML内容，插入浮动条代码
  useEffect(() => {
    if (!content) return;

    try {
      // 使用sanitizeHtml函数处理HTML内容
      let cleanedContent = sanitizeHtml(content);
      
      // 创建浮动条的JS和CSS代码
      const floatingBarCode = `
      <style>
        #qiaomu-floating-bar-container {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 9999;
          pointer-events: none;
        }
        #qiaomu-floating-bar {
          background-color: rgba(31, 41, 55, 0.95);
          color: white;
          padding: 12px 16px;
          box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.15);
          padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
          transition: transform 0.3s ease;
          pointer-events: auto;
        }
        #qiaomu-floating-bar.hidden {
          transform: translateY(100%);
        }
        #qiaomu-floating-bar-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          max-width: 1200px;
          margin: 0 auto;
        }
        #qiaomu-floating-bar-title {
          font-weight: 500;
          font-size: 14px;
          margin-right: 16px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 60%;
        }
        #qiaomu-floating-bar-actions {
          display: flex;
          gap: 8px;
        }
        .qiaomu-floating-bar-button {
          background-color: #4b5563;
          color: white;
          border: none;
          padding: 8px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: background-color 0.2s;
          text-decoration: none;
        }
        .qiaomu-floating-bar-button:hover {
          background-color: #374151;
        }
        #qiaomu-toggle-button {
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color: #4b5563;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 10000;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
          transition: background-color 0.2s;
          border: none;
          padding: 0;
          pointer-events: auto;
        }
        #qiaomu-toggle-button:hover {
          background-color: #374151;
        }
        @media (max-width: 640px) {
          #qiaomu-floating-bar-title {
            font-size: 12px;
            max-width: 40%;
          }
          .qiaomu-floating-bar-button {
            padding: 6px 8px;
            font-size: 12px;
          }
        }
      </style>
      <script>
        (function() {
          // 创建浮动条元素
          function createFloatingBar() {
            const container = document.createElement('div');
            container.id = 'qiaomu-floating-bar-container';
            
            const floatingBar = document.createElement('div');
            floatingBar.id = 'qiaomu-floating-bar';
            
            const content = document.createElement('div');
            content.id = 'qiaomu-floating-bar-content';
            
            const title = document.createElement('div');
            title.id = 'qiaomu-floating-bar-title';
            title.textContent = '${title || '文章详情'}';
            
            const actions = document.createElement('div');
            actions.id = 'qiaomu-floating-bar-actions';
            
            const returnButton = document.createElement('a');
            returnButton.href = '${returnUrl}';
            returnButton.className = 'qiaomu-floating-bar-button';
            returnButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"></path></svg> 返回';
            
            actions.appendChild(returnButton);
            
            ${postId ? `
            const editButton = document.createElement('a');
            editButton.href = '/admin/posts/edit/${postId}';
            editButton.className = 'qiaomu-floating-bar-button';
            editButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg> 编辑';
            actions.appendChild(editButton);
            ` : ''}
            
            content.appendChild(title);
            content.appendChild(actions);
            floatingBar.appendChild(content);
            
            const toggleButton = document.createElement('button');
            toggleButton.id = 'qiaomu-toggle-button';
            toggleButton.setAttribute('aria-label', '显示/隐藏信息栏');
            toggleButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"></path></svg>';
            
            container.appendChild(floatingBar);
            container.appendChild(toggleButton);
            
            document.body.appendChild(container);
            
            // 从localStorage读取状态
            const isBarHidden = localStorage.getItem('qiaomu-bar-hidden') === 'true';
            if (isBarHidden) {
              floatingBar.classList.add('hidden');
              toggleButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"></path></svg>';
            }
            
            // 切换浮动条显示/隐藏
            toggleButton.addEventListener('click', function() {
              floatingBar.classList.toggle('hidden');
              localStorage.setItem('qiaomu-bar-hidden', floatingBar.classList.contains('hidden'));
              
              // 更新按钮图标
              if (floatingBar.classList.contains('hidden')) {
                toggleButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"></path></svg>';
              } else {
                toggleButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"></path></svg>';
              }
            });
          }
          
          // 当DOM加载完成后创建浮动条
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', createFloatingBar);
          } else {
            createFloatingBar();
          }
        })();
      </script>
      `;
      
      // 将浮动条代码插入到HTML内容中
      if (cleanedContent.includes('</head>')) {
        // 如果有</head>标签，在其前面插入CSS
        cleanedContent = cleanedContent.replace('</head>', `${floatingBarCode}</head>`);
      } else if (cleanedContent.includes('<body>')) {
        // 如果有<body>标签，在其后面插入代码
        cleanedContent = cleanedContent.replace('<body>', `<body>${floatingBarCode}`);
      } else if (cleanedContent.includes('</html>')) {
        // 如果有</html>标签但没有上述标签，在</html>前面插入代码
        cleanedContent = cleanedContent.replace('</html>', `${floatingBarCode}</html>`);
      } else {
        // 如果都没有，直接在末尾添加代码
        cleanedContent = `${cleanedContent}${floatingBarCode}`;
      }
      
      setProcessedHtml(cleanedContent);
    } catch (error) {
      console.error('处理HTML内容时出错:', error);
      setProcessedHtml(content); // 出错时使用原始内容
    }
  }, [content, title, returnUrl, postId]);

  // 直接使用dangerouslySetInnerHTML渲染处理后的HTML内容
  return (
    <div 
      dangerouslySetInnerHTML={{ __html: processedHtml }}
    />
  );
}
