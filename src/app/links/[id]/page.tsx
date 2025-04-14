import { getMenus, getSiteSettings, getCategories, getTags } from '@/lib/services/settings';
import SimpleNavigation from '@/components/SimpleNavigation';
import SimpleFooter from '@/components/SimpleFooter';
import Sidebar from '@/components/Sidebar';
import { adaptMenus } from '@/lib/utils/menu-adapters';
import { getLink } from '@/lib/actions/links';
import { notFound } from 'next/navigation';
import { ArrowTopRightOnSquareIcon as ExternalLinkIcon } from '@heroicons/react/24/outline';

export default async function LinkPage({ params }: { params: Promise<{ id: string }> }) {
  // 获取菜单、网站设置、分类和标签
  const [menus, settings, categories, tags] = await Promise.all([
    getMenus(null),
    getSiteSettings(),
    getCategories(),
    getTags()
  ]);

  // 获取网站名称
  const siteTitle = settings['site_name'] || '向阳乔木的个人博客';

  // 获取链接详情
  const { id: idParam } = await params;
  const id = parseInt(idParam);
  if (isNaN(id)) {
    notFound();
  }

  let linkData;
  try {
    // 使用服务器操作获取链接详情
    linkData = await getLink(id);
  } catch (error) {
    console.error('获取链接详情失败:', error);
    notFound();
  }

  return (
    <div>
      <SimpleNavigation siteTitle={siteTitle} menus={adaptMenus(menus)} />

      <main className="container px-2 pt-4 pb-8">
        <div className="max-w-6xl mx-auto px-0 sm:px-4 lg:px-8 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 左侧内容区 */}
            <div className="col-span-1 lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden mt-0">
                <div className="p-6 mb-4 border-b border-gray-100 dark:border-gray-700">
                  <h1 className="text-2xl font-bold mb-2">{linkData.title}</h1>
                  <div className="flex items-center text-gray-500">
                    <span className="mr-2">收藏于 {new Date(linkData.createdAt).toLocaleDateString()}</span>
                    <a
                      href={linkData.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      访问链接 <ExternalLinkIcon className="h-4 w-4 ml-1" />
                    </a>
                  </div>
                </div>

                <div className="p-6">
                  {linkData.coverImage && (
                    <div className="mb-6">
                      <img
                        src={linkData.coverImage}
                        alt={linkData.title}
                        className="w-full max-h-80 object-cover rounded-lg"
                      />
                    </div>
                  )}

                  {linkData.description && (
                    <div className="mb-6 text-gray-700 dark:text-gray-300">
                      <h2 className="text-lg font-semibold mb-2">描述</h2>
                      <p>{linkData.description}</p>
                    </div>
                  )}

                  {linkData.tags && (
                    <div className="mb-6">
                      <h2 className="text-lg font-semibold mb-2">标签</h2>
                      <div className="flex flex-wrap gap-2">
                        {(() => {
                          try {
                            const parsedTags = JSON.parse(linkData.tags);
                            return parsedTags.map((tag: any, index: number) => {
                              const tagValue = tag.value || tag;
                              return (
                                <a
                                  key={index}
                                  href={`/links?tag=${encodeURIComponent(tagValue)}`}
                                  className="inline-flex items-center px-3 py-1 rounded-md text-sm bg-blue-100 text-blue-800 hover:bg-blue-200"
                                >
                                  {tagValue}
                                </a>
                              );
                            });
                          } catch (e) {
                            // 兼容旧格式（逗号分隔的字符串）
                            return linkData.tags.split(',').map((tag, index) => (
                              <a
                                key={index}
                                href={`/links?tag=${encodeURIComponent(tag.trim())}`}
                                className="inline-flex items-center px-3 py-1 rounded-md text-sm bg-blue-100 text-blue-800 hover:bg-blue-200"
                              >
                                {tag.trim()}
                              </a>
                            ));
                          }
                        })()}
                      </div>
                    </div>
                  )}

                  <div className="mt-8">
                    <a
                      href={linkData.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      访问链接 <ExternalLinkIcon className="h-4 w-4 ml-2" />
                    </a>
                    <a
                      href="/links"
                      className="inline-flex items-center px-4 py-2 ml-4 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                    >
                      返回列表
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* 右侧边栏 */}
            <div className="col-span-1">
              <Sidebar
                categories={categories}
                tags={tags}
                showCategories={true}
                showPopularTags={true}
                showRecentPosts={true}
              />
            </div>
          </div>
        </div>
      </main>

      <SimpleFooter />
    </div>
  );
}
