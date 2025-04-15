import { Metadata } from 'next';
import SimpleNavigation from '@/components/SimpleNavigation';
import SimpleFooter from '@/components/SimpleFooter';
import Sidebar from '@/components/Sidebar';
import { getCategories, getTags, getMenus, getSiteSettings } from '@/lib/services/settings';
import { adaptMenus } from '@/lib/utils/menu-adapters';
import FeaturedSliderClient from '@/components/FeaturedSliderClient';
import LatestArticlesClient from '@/components/LatestArticlesClient';

// 使用 segmentCache 配置，这是Next.js 15.2.4中推荐的缓存控制方法
export const segmentCache = { revalidate: 0 };

export const metadata: Metadata = {
  title: '向阳乔木的个人博客',
  description: '分享技术、生活和思考，记录成长的点滴。',
};

export default async function Home() {
  // 获取分类、标签和菜单
  const [categories, tags, menus, settings] = await Promise.all([
    getCategories(),
    getTags(),
    getMenus(),
    getSiteSettings(),
  ]);

  // 调试输出菜单数据
  console.log('首页获取到的菜单数据:', JSON.stringify(menus, null, 2));

  // 获取网站设置
  const siteSettings = Array.isArray(settings) 
    ? settings.reduce((acc: Record<string, string | null>, setting: { key: string, value: string | null }) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {} as Record<string, string | null>)
    : settings;

  return (
    <div>
      <SimpleNavigation siteTitle={siteSettings['site_name'] || '向阳乔木的个人博客'} menus={adaptMenus(menus)} />

      <main className="container px-2 pt-4 pb-8">
        <div className="max-w-6xl mx-auto px-0 sm:px-4 lg:px-8 mt-4">
          {/* 特色文章轮播 - 使用客户端组件 */}
          <div className="mb-8">
            <FeaturedSliderClient />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 左侧内容区 - 使用客户端组件 */}
            <div className="col-span-1 lg:col-span-2">
              <LatestArticlesClient />
            </div>

            {/* 右侧边栏 */}
            <div className="col-span-1">
              <Sidebar
                categories={categories}
                tags={tags}
                showCategories={true}
                showPopularTags={true}
                showRecentPosts={true}
                isHomePage={true}
              />
            </div>
          </div>
        </div>
      </main>

      <SimpleFooter />
    </div>
  );
}
