import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { sanitizeHtml } from '@/utils/html-sanitizer';

export async function GET(request: NextRequest) {
  try {
    // 获取文章ID
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    if (!id) {
      return new NextResponse('Missing post ID', { status: 400 });
    }
    
    // 查询文章内容
    const posts = await db
      .select({
        id: schema.posts.id,
        title: schema.posts.title,
        content: schema.posts.content,
      })
      .from(schema.posts)
      .where(eq(schema.posts.id, parseInt(id)))
      .limit(1);
    
    if (!posts.length) {
      return new NextResponse('Post not found', { status: 404 });
    }
    
    const post = posts[0];
    
    // 清理HTML内容
    let cleanedContent = sanitizeHtml(post.content || '');
    
    // 创建浮动条代码
    const floatingBarCode = `
    <style>
      #qiaomu-floating-bar {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background-color: rgba(31, 41, 55, 0.95);
        color: white;
        padding: 12px 16px;
        z-index: 9999;
        box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.15);
        padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
        transition: transform 0.3s ease;
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
      #qiaomu-floating-bar-left {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      #qiaomu-floating-bar-title {
        font-weight: 500;
        font-size: 14px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 200px;
      }
      #qiaomu-floating-bar-actions {
        display: flex;
        gap: 8px;
        align-items: center;
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
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0.7;
        transition: opacity 0.2s;
      }
      #qiaomu-toggle-button:hover {
        opacity: 1;
      }
      @media (max-width: 640px) {
        #qiaomu-floating-bar {
          padding: 10px 12px;
        }
        #qiaomu-floating-bar-title {
          font-size: 12px;
          max-width: 120px;
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
          const floatingBar = document.createElement('div');
          floatingBar.id = 'qiaomu-floating-bar';
          
          const content = document.createElement('div');
          content.id = 'qiaomu-floating-bar-content';
          
          const left = document.createElement('div');
          left.id = 'qiaomu-floating-bar-left';
          
          const title = document.createElement('div');
          title.id = 'qiaomu-floating-bar-title';
          title.textContent = '${post.title || '文章详情'}';
          
          left.appendChild(title);
          
          const actions = document.createElement('div');
          actions.id = 'qiaomu-floating-bar-actions';
          
          const returnButton = document.createElement('a');
          returnButton.href = '/';
          returnButton.className = 'qiaomu-floating-bar-button';
          returnButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"></path></svg> 返回';
          
          const editButton = document.createElement('a');
          editButton.href = '/admin/posts/edit/${post.id}';
          editButton.className = 'qiaomu-floating-bar-button';
          editButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg> 编辑';
          
          const toggleButton = document.createElement('button');
          toggleButton.id = 'qiaomu-toggle-button';
          toggleButton.setAttribute('aria-label', '隐藏信息栏');
          toggleButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"></path></svg>';
          
          actions.appendChild(returnButton);
          actions.appendChild(editButton);
          actions.appendChild(toggleButton);
          
          content.appendChild(left);
          content.appendChild(actions);
          floatingBar.appendChild(content);
          
          document.body.appendChild(floatingBar);
          
          // 从localStorage读取状态
          const isBarHidden = localStorage.getItem('qiaomu-bar-hidden') === 'true';
          if (isBarHidden) {
            floatingBar.classList.add('hidden');
          }
          
          // 切换浮动条显示/隐藏
          toggleButton.addEventListener('click', function() {
            floatingBar.classList.add('hidden');
            localStorage.setItem('qiaomu-bar-hidden', 'true');
          });
          
          // 添加双击页面显示浮动条的功能
          document.addEventListener('dblclick', function() {
            if (floatingBar.classList.contains('hidden')) {
              floatingBar.classList.remove('hidden');
              localStorage.setItem('qiaomu-bar-hidden', 'false');
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
    
    // 返回HTML内容，设置正确的Content-Type
    return new NextResponse(cleanedContent, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8'
      }
    });
  } catch (error) {
    console.error('Error serving HTML content:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
