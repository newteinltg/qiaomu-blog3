import { db } from '@/lib/db';
import * as schema from '@/lib/schema';
import { eq, ne, lt, gt, asc, desc, and } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { Metadata } from 'next';
import { Suspense } from 'react';
import SimpleNavigation from '@/components/SimpleNavigation';
import SimpleFooter from '@/components/SimpleFooter';
import HtmlPageLayout from '@/components/HtmlPageLayout';
import { getCategories, getTags, getMenus, getAllSettings } from '@/lib/services/settings';
import { adaptMenus } from '@/lib/utils/menu-adapters';
import Sidebar from '@/components/Sidebar';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import EditPostLink from '@/components/EditPostLink';

// 动态生成元数据
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;

  const posts = await db
    .select()
    .from(schema.posts)
    .where(eq(schema.posts.slug, slug));

  if (!posts.length) {
    return {
      title: '文章不存在',
      description: '找不到请求的文章',
    };
  }

  const post = posts[0];

  return {
    title: `${post.title} - 向阳乔木的个人博客`,
    description: post.excerpt || `阅读文章：${post.title}`,
    openGraph: {
      title: post.title,
      description: post.excerpt || `阅读文章：${post.title}`,
      images: post.coverImage ? [post.coverImage] : [],
    },
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // 获取分类、标签、菜单和网站设置
  const [categories, tags, menus, settings] = await Promise.all([
    getCategories(),
    getTags(),
    getMenus(),
    getAllSettings()
  ]);

  // 获取网站设置
  const siteSettings = settings.reduce((acc: Record<string, string | null>, setting: { key: string, value: string | null }) => {
    acc[setting.key] = setting.value;
    return acc;
  }, {} as Record<string, string | null>);

  // 获取文章详情
  const posts = await db
    .select()
    .from(schema.posts)
    .where(eq(schema.posts.slug, slug));

  if (!posts.length) {
    notFound();
  }

  const post = posts[0];

  // 如果文章是草稿状态，返回404
  if (post.published !== 1) {
    notFound();
  }

  // 获取作者信息
  let author = null;
  if (post.authorId) {
    const authors = await db
      .select({
        id: schema.users.id,
        email: schema.users.email
      })
      .from(schema.users)
      .where(eq(schema.users.id, post.authorId))
      .limit(1);

    if (authors.length) {
      // 使用类型断言扩展author对象
      author = authors[0] as typeof authors[0] & { name: string; avatar: string };
      // 添加默认的name和avatar属性
      author.name = author.email.split('@')[0]; // 使用邮箱用户名作为默认名称
      author.avatar = '/images/default-avatar.png'; // 使用默认头像
    }
  }

  // 获取主分类信息
  let category = null;
  if (post.categoryId) {
    const categories = await db
      .select({
        id: schema.categories.id,
        name: schema.categories.name,
        slug: schema.categories.slug
      })
      .from(schema.categories)
      .where(eq(schema.categories.id, post.categoryId))
      .limit(1);

    if (categories.length) {
      category = categories[0];
    }
  }

  // 获取文章的所有分类
  let postCategories: { id: number; name: string; slug: string }[] = [];
  try {
    const categoriesResult = await db
      .select({
        id: schema.categories.id,
        name: schema.categories.name,
        slug: schema.categories.slug,
      })
      .from(schema.postCategories)
      .leftJoin(schema.categories, eq(schema.postCategories.categoryId, schema.categories.id))
      .where(eq(schema.postCategories.postId, post.id));
    
    // 过滤掉null值并转换类型
    postCategories = categoriesResult
      .filter(cat => cat.id !== null && cat.name !== null && cat.slug !== null)
      .map(cat => ({
        id: cat.id as number,
        name: cat.name as string,
        slug: cat.slug as string
      }));
  } catch (error) {
    console.error('获取文章分类失败:', error);
  }

  // 获取文章的所有标签
  let postTags: { id: number; name: string; slug: string }[] = [];
  try {
    const tagsResult = await db
      .select({
        id: schema.tags.id,
        name: schema.tags.name,
        slug: schema.tags.slug,
      })
      .from(schema.postTags)
      .leftJoin(schema.tags, eq(schema.postTags.tagId, schema.tags.id))
      .where(eq(schema.postTags.postId, post.id));
    
    // 过滤掉null值并转换类型
    postTags = tagsResult
      .filter(tag => tag.id !== null && tag.name !== null && tag.slug !== null)
      .map(tag => ({
        id: tag.id as number,
        name: tag.name as string,
        slug: tag.slug as string
      }));
  } catch (error) {
    console.error('获取文章标签失败:', error);
  }

  // 获取推荐文章（最新置顶的6篇文章）
  let recommendedPosts: { id: number; title: string; slug: string; coverImage: string | null; createdAt: string }[] = [];
  try {
    // 使用 Drizzle ORM 查询置顶文章
    const pinnedPosts = await db
      .select({
        id: schema.posts.id,
        title: schema.posts.title,
        slug: schema.posts.slug,
        coverImage: schema.posts.coverImage,
        createdAt: schema.posts.createdAt,
      })
      .from(schema.posts)
      .where(
        and(
          eq(schema.posts.published, 1),
          eq(schema.posts.pinned, 1),
          ne(schema.posts.id, post.id)
        )
      )
      .orderBy(desc(schema.posts.createdAt))
      .limit(6);

    console.log('置顶文章查询结果:', pinnedPosts.map(p => ({ id: p.id, title: p.title })));

    // 如果有置顶文章，使用置顶文章
    if (pinnedPosts && pinnedPosts.length > 0) {
      recommendedPosts = pinnedPosts
        .filter(post => post.id !== null && post.title !== null && post.slug !== null && post.createdAt !== null)
        .map(post => ({
          id: post.id as number,
          title: post.title as string,
          slug: post.slug as string,
          coverImage: post.coverImage as string | null,
          createdAt: post.createdAt as string // 保持createdAt为字符串类型
        }));
      console.log('使用置顶文章作为推荐文章:', recommendedPosts.map(p => ({ id: p.id, title: p.title })));
    } else {
      // 如果没有置顶文章，使用空数组
      recommendedPosts = [];
      console.log('没有置顶文章，使用空数组');
    }
  } catch (error) {
    console.error('Error fetching recommended posts:', error);
    // 如果出错，使用空数组
    recommendedPosts = [];
  }

  // 获取上一篇和下一篇文章
  let prevPost = null;
  let nextPost = null;
  try {
    // 直接使用数据库查询获取上一篇和下一篇文章
    // 避免使用API调用，减少复杂性

    // 获取上一篇文章（ID小于当前文章的最大一篇）
    const prevPosts = await db
      .select({
        id: schema.posts.id,
        title: schema.posts.title,
        slug: schema.posts.slug,
      })
      .from(schema.posts)
      .where(and(
        lt(schema.posts.id, post.id),
        eq(schema.posts.published, 1) // 只获取已发布的文章
      ))
      .orderBy(desc(schema.posts.id))
      .limit(1);

    // 获取下一篇文章（ID大于当前文章的最小一篇）
    const nextPosts = await db
      .select({
        id: schema.posts.id,
        title: schema.posts.title,
        slug: schema.posts.slug,
      })
      .from(schema.posts)
      .where(and(
        gt(schema.posts.id, post.id),
        eq(schema.posts.published, 1) // 只获取已发布的文章
      ))
      .orderBy(asc(schema.posts.id))
      .limit(1);

    // 使用查询结果
    prevPost = prevPosts.length > 0 ? prevPosts[0] : null;
    nextPost = nextPosts.length > 0 ? nextPosts[0] : null;
  } catch (error) {
    console.error('Error fetching prev/next posts:', error);
  }

  // 在渲染前准备文章数据，添加categories和tags属性
  const postWithRelations = {
    ...post,
    categories: postCategories,
    tags: postTags
  };

  // 如果是HTML全页面类型，使用不同的布局
  if (postWithRelations.pageType === 'html') {
    return (
      <iframe 
        src={`/api/html-content?id=${post.id}`}
        style={{ width: '100%', height: '100vh', border: 'none' }}
      />
    );
  }

  // 正常的Markdown文章布局
  return (
    <>
      <SimpleNavigation siteTitle={siteSettings.site_name || '向阳乔木的个人博客'} menus={adaptMenus(menus)} />

      <main className="container px-2 pt-4 pb-8">
        <div className="max-w-6xl mx-auto px-0 sm:px-4 lg:px-8 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 左侧内容区 */}
            <div className="col-span-1 lg:col-span-2">
              <article className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden mt-0">
                {/* 文章封面图 */}
                <div className="relative w-full h-80">
                  {postWithRelations.coverImage && postWithRelations.coverImage.trim() ? (
                    <img
                      src={postWithRelations.coverImage}
                      alt={postWithRelations.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <svg className="w-24 h-24 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 2v8l4-2 4 4 4-4 4 2V6H4z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* 文章内容 */}
                <div className="p-4 md:p-4">
                  {/* 文章分类 */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {postWithRelations.categories.map(category => (
                      <Link
                        key={category.id}
                        href={`/categories/${category.slug}`}
                        className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full"
                      >
                        {category.name}
                      </Link>
                    ))}
                  </div>

                  {/* 文章标题 */}
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 leading-relaxed">
                    {postWithRelations.title}
                  </h1>

                  {/* 文章元信息 */}
                  <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm mb-8">
                    <span className="mr-4">
                      发布于 {formatDate(postWithRelations.createdAt)}
                    </span>
                    {postWithRelations.updatedAt && postWithRelations.updatedAt !== postWithRelations.createdAt && (
                      <span className="flex items-center">
                        更新于 {formatDate(postWithRelations.updatedAt)}
                        <EditPostLink postId={postWithRelations.id} />
                      </span>
                    )}
                    {(!postWithRelations.updatedAt || postWithRelations.updatedAt === postWithRelations.createdAt) && (
                      <EditPostLink postId={postWithRelations.id} />
                    )}
                  </div>

                  {/* 文章内容 - Markdown渲染 */}
                  <div className="prose prose-lg dark:prose-invert max-w-none prose-custom prose-mobile">
                    <Markdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw, rehypeSanitize]}
                      components={{
                        // 使用类型断言解决TypeScript类型错误
                        code({node, inline, className, children, ...props}: any) {
                          const match = /language-(\w+)/.exec(className || '');
                          return !inline && match ? (
                            <SyntaxHighlighter
                              style={tomorrow as any}
                              language={match[1]}
                              PreTag="div"
                              {...props}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          ) : (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          );
                        }
                      }}
                    >
                      {postWithRelations.content || ''}
                    </Markdown>
                  </div>

                  {/* 文章标签 */}
                  {postWithRelations.tags.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg font-semibold mb-3">标签</h3>
                      <div className="flex flex-wrap gap-2">
                        {postWithRelations.tags.map(tag => (
                          <Link
                            key={tag.id}
                            href={`/tags/${tag.slug}`}
                            className="inline-block px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-full"
                          >
                            #{tag.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </article>

              {/* 上一篇和下一篇文章导航 */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden mt-4 p-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  {prevPost ? (
                    <Link
                      href={`/posts/${prevPost.slug}`}
                      className="flex items-center text-gray-800 dark:text-gray-300 hover:underline"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="line-clamp-1 max-w-[200px] sm:max-w-[300px]">上一篇: {prevPost.title.length > 20 ? prevPost.title.substring(0, 20) + '...' : prevPost.title}</span>
                    </Link>
                  ) : (
                    <div className="text-gray-400 dark:text-gray-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 inline" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>没有更早的文章了</span>
                    </div>
                  )}

                  {nextPost ? (
                    <Link
                      href={`/posts/${nextPost.slug}`}
                      className="flex items-center text-gray-800 dark:text-gray-300 hover:underline"
                    >
                      <span className="line-clamp-1 max-w-[200px] sm:max-w-[300px]">下一篇: {nextPost.title.length > 20 ? nextPost.title.substring(0, 20) + '...' : nextPost.title}</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </Link>
                  ) : (
                    <div className="text-gray-400 dark:text-gray-500">
                      <span>没有更新的文章了</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1 inline" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              {/* 推荐文章 */}
              {recommendedPosts.length > 0 && (
                <section className="mt-8">
                  <h2 className="text-xl font-bold mb-4">推荐文章</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {recommendedPosts.map(post => (
                      <Link
                        key={post.id}
                        href={`/posts/${post.slug}`}
                        className="block bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 hover:-translate-y-1"
                      >
                        {post.coverImage && post.coverImage.trim() ? (
                          <img
                            src={post.coverImage}
                            alt={post.title}
                            className="w-full h-40 object-cover"
                          />
                        ) : (
                          <div className="w-full h-40 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 2v8l4-2 4 4 4-4 4 2V6H4z" />
                            </svg>
                          </div>
                        )}
                        <div className="p-4">
                          <h3 className="font-semibold mb-2 line-clamp-2 text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400">
                            {post.title}
                          </h3>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {post.createdAt}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* 右侧边栏 */}
            <div className="col-span-1">
              <Sidebar
                categories={categories}
                tags={tags}
                showCategories={true}
                showRecentPosts={true}
                showPopularTags={true}
              />
            </div>
          </div>
        </div>
      </main>

      <SimpleFooter />
    </>
  );
}