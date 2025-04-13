import { db } from '@/lib/db';
import * as schema from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import SimpleNavigation from '@/components/SimpleNavigation';
import SimpleFooter from '@/components/SimpleFooter';
import { getMenus, getSiteSettings, getCategories, getTags } from '@/lib/services/settings';
import { adaptMenus } from '@/lib/utils/menu-adapters';
import TagPostsClient from './page.client';
import Sidebar from '@/components/Sidebar';

export default async function TagPage() {

  // 获取菜单、网站设置、分类和标签
  const [menus, settings, categories, tags] = await Promise.all([
    getMenus(),
    getSiteSettings(),
    getCategories(),
    getTags()
  ]);

  // 获取网站名称
  const siteTitle = settings['site_name'] || '向阳乔木的个人博客';

  // 不再在服务器组件中获取标签信息

  // 不需要获取标签下的文章，因为我们使用客户端组件通过 API 获取

  return (
    <div>
      <SimpleNavigation siteTitle={siteTitle} menus={adaptMenus(menus)} />

      <main className="container px-2 pt-4 pb-8">
        <div className="max-w-6xl mx-auto px-0 sm:px-4 lg:px-8 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 左侧内容区 */}
            <div className="col-span-1 lg:col-span-2">
              <TagPostsClient />
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
