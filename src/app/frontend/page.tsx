import Link from 'next/link';
// import { db } from '@/lib/db'; // 注释掉数据库相关
// import * as schema from '@/lib/schema'; // 注释掉数据库相关
// import { eq, desc, and, InferSelectModel } from 'drizzle-orm'; // 注释掉数据库相关
// import PostCard from '@/components/PostCard'; // 注释掉自定义组件
// import Sidebar from '@/components/Sidebar'; // 注释掉自定义组件

export default function Home() {
  console.log("--- Rendering Simplified Home Component ---"); // 在服务器控制台查看

  // 模拟一些占位符
  const pinnedPostPlaceholder = { id: 1, title: "特色文章标题 (占位)" };
  const recentPostsPlaceholder = [
    { id: 2, title: "最新文章1 (占位)" },
    { id: 3, title: "最新文章2 (占位)" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* 主内容区域 */}
      <div className="lg:col-span-2">
        {/* 特色文章区域 */}
        <div className="mb-12">
          <h2 className="text-2xl font-serif font-bold mb-6 pb-2 border-b border-gray-200 dark:border-gray-700">
            特色文章
          </h2>
          {/* 使用简单 div 代替 PostCard */}
          <div className="p-4 border rounded bg-gray-100 dark:bg-gray-800">
            {pinnedPostPlaceholder.title}
          </div>
        </div>

        {/* 最新文章区域 */}
        <div>
          <h2 className="text-2xl font-serif font-bold mb-6 pb-2 border-b border-gray-200 dark:border-gray-700">
            最新文章
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recentPostsPlaceholder.map(post => (
              // 使用简单 div 代替 PostCard
              <div key={post.id} className="p-4 border rounded bg-white dark:bg-gray-700">
                {post.title}
              </div>
            ))}
          </div>

          {/* 更多文章按钮 */}
          <div className="mt-8 text-center">
            <Link
              href="/posts"
              className="btn-secondary inline-flex items-center group"
            >
              查看更多文章 (占位)
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* 侧边栏 */}
      <div className="lg:col-span-1">
         {/* 使用简单 div 代替 Sidebar */}
         <div className="p-4 border rounded bg-blue-100 dark:bg-blue-900">
           侧边栏 (占位)
         </div>
      </div>
    </div>
  );
}
