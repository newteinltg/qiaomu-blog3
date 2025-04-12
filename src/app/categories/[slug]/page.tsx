import { getMenus, getSiteSettings, getCategories, getTags } from '@/lib/services/settings';
import SimpleNavigation from '@/components/SimpleNavigation';
import SimpleFooter from '@/components/SimpleFooter';
import CategoryPostsClient from './page.client';
import Sidebar from '@/components/Sidebar';
import { adaptMenus } from '@/lib/utils/menu-adapters';

// 定义MenuItem类型，与SimpleNavigation组件期望的类型一致
type MenuItem = {
  id: number;
  name: string;
  url: string; // 非空字符串
  isExternal: number;
  parentId: number | null;
  order: number;
  isActive: number;
};

export default async function CategoryPage() {
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

      <main className="container pt-4 pb-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 左侧内容区 */}
            <div className="col-span-1 lg:col-span-2">
              <CategoryPostsClient />
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
