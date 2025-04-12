import { db } from '@/lib/db';
import * as schema from '@/lib/schema';
import { eq, desc, and } from 'drizzle-orm';
import Link from 'next/link';
import PostCard from '@/components/PostCard';
import Sidebar from '@/components/Sidebar';

export default async function Home() {
  // 获取置顶文章
  const pinnedPosts = await db.select({
    id: schema.posts.id,
    title: schema.posts.title,
    slug: schema.posts.slug,
    excerpt: schema.posts.excerpt,
    content: schema.posts.content,
    coverImage: schema.posts.coverImage,
    createdAt: schema.posts.createdAt,
    authorId: schema.posts.authorId,
    authorEmail: schema.users.email
  })
  .from(schema.posts)
  .where(and(
    eq(schema.posts.published, 1),
    eq(schema.posts.pinned, 1)
  ))
  .leftJoin(schema.users, eq(schema.posts.authorId, schema.users.id))
  .orderBy(desc(schema.posts.createdAt))
  .limit(1)
  .all();

  // 获取最新文章
  const recentPosts = await db.select({
    id: schema.posts.id,
    title: schema.posts.title,
    slug: schema.posts.slug,
    excerpt: schema.posts.excerpt,
    content: schema.posts.content,
    coverImage: schema.posts.coverImage,
    createdAt: schema.posts.createdAt,
    authorId: schema.posts.authorId,
    authorEmail: schema.users.email
  })
  .from(schema.posts)
  .where(eq(schema.posts.published, 1))
  .leftJoin(schema.users, eq(schema.posts.authorId, schema.users.id))
  .orderBy(desc(schema.posts.createdAt))
  .limit(6)
  .all();

  // 过滤掉置顶文章，避免重复显示
  const filteredRecentPosts = recentPosts.filter(
    post => !pinnedPosts.some((pinnedPost: typeof recentPosts[0]) => pinnedPost.id === post.id)
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        {/* 特色文章区域 */}
        {pinnedPosts.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-serif font-bold mb-6 pb-2 border-b border-gray-200 dark:border-gray-700">
              特色文章
            </h2>
            <PostCard post={pinnedPosts[0]} featured={true} />
          </div>
        )}

        {/* 最新文章区域 */}
        <div>
          <h2 className="text-2xl font-serif font-bold mb-6 pb-2 border-b border-gray-200 dark:border-gray-700">
            最新文章
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredRecentPosts.map(post => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
          
          {/* 更多文章按钮 */}
          {filteredRecentPosts.length > 0 && (
            <div className="mt-8 text-center">
              <Link 
                href="/posts" 
                className="btn-secondary inline-flex items-center"
              >
                查看更多文章
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          )}
          
          {/* 无文章提示 */}
          {filteredRecentPosts.length === 0 && pinnedPosts.length === 0 && (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-gray-600 dark:text-gray-400">暂无文章</p>
            </div>
          )}
        </div>
      </div>
      
      {/* 侧边栏 */}
      <div className="lg:col-span-1">
        <Sidebar />
      </div>
    </div>
  );
}
