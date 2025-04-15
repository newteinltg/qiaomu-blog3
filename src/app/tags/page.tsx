import { Metadata } from 'next';
import { getMenus, getSiteSettings, getCategories, getTags } from '@/lib/services/settings';
import SimpleNavigation from '@/components/SimpleNavigation';
import SimpleFooter from '@/components/SimpleFooter';
import TagsClient from './page.client';
import Sidebar from '@/components/Sidebar';
import { adaptMenus } from '@/lib/utils/menu-adapters';

export const metadata: Metadata = {
  title: '标签列表 - 向阳乔木的个人博客',
  description: '向阳乔木的个人博客标签列表，按主题浏览文章内容。',
};

// 强制动态渲染，确保每次访问都获取最新数据
export const dynamic = 'force-dynamic';

export default async function AllTagsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  // 获取查询参数
  const params = await searchParams;
  const page = parseInt(params?.page || '1', 10);

  // 获取菜单、网站设置、分类和标签
  const [menus, settings, categories, tags] = await Promise.all([
    getMenus(),
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
              <TagsClient initialPage={page} />
            </div>

            {/* 右侧边栏 */}
            <div className="col-span-1">
              <Sidebar
                categories={categories}
                tags={tags}
                showCategories={true}
                showPopularTags={false} // 不在侧边栏显示热门标签，因为主内容已经是标签列表
                showRecentPosts={true}
                showLatestPosts={true}
              />
            </div>
          </div>
        </div>
      </main>

      <SimpleFooter />
    </div>
  );
}
