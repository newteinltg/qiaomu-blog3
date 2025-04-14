import { getMenus, getSiteSettings, getCategories, getTags } from '@/lib/services/settings';
import SimpleNavigation from '@/components/SimpleNavigation';
import SimpleFooter from '@/components/SimpleFooter';
import Sidebar from '@/components/Sidebar';
import { adaptMenus } from '@/lib/utils/menu-adapters';
import LinksClient from './page.client';

export default async function LinksPage() {
  // 获取菜单、网站设置、分类和标签
  const [menus, settings, categories, tags] = await Promise.all([
    getMenus(null),
    getSiteSettings(),
    getCategories(),
    getTags()
  ]);

  // 获取网站名称
  const siteTitle = settings['site_name'] || '向阳乔木的个人博客';

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
                  <h1 className="text-2xl font-bold mb-2">我的收藏</h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    这里收集了我觉得有价值的网站和资源
                  </p>
                </div>
                
                <div className="p-6">
                  <LinksClient />
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
