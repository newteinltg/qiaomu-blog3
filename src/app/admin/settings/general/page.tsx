'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function GeneralSettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState<boolean>(false);

  // 基本设置表单状态
  const [siteName, setSiteName] = useState<string>('');
  const [siteDescription, setSiteDescription] = useState<string>('');

  // Hero区域设置
  const [heroTitle, setHeroTitle] = useState<string>('');
  const [heroSubtitle, setHeroSubtitle] = useState<string>('');

  // 社交链接设置
  const [socialLinks, setSocialLinks] = useState<string>('');

  // 底部推荐链接
  const [footerLinks, setFooterLinks] = useState<string>('');

  // 获取现有设置
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings/general');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            const settings = data.data.settings;

            // 设置基本信息
            setSiteName(settings.site_name || '');
            setSiteDescription(settings.site_description || '');

            // 设置Hero区域信息
            setHeroTitle(settings.hero_title || '');
            setHeroSubtitle(settings.hero_subtitle || '');

            // 设置社交链接
            setSocialLinks(settings.social_links || '');

            // 设置底部推荐链接
            setFooterLinks(settings.footer_links || '');
          }
        }
      } catch (error) {
        console.error('获取网站设置失败:', error);
        toast({
          variant: "destructive",
          title: "错误",
          description: "获取网站设置失败"
        });
      }
    };

    fetchSettings();
  }, [toast]);

  // 保存设置
  const saveSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/settings/general', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          site_name: siteName,
          site_description: siteDescription,
          hero_title: heroTitle,
          hero_subtitle: heroSubtitle,
          social_links: socialLinks,
          footer_links: footerLinks,
        }),
      });

      if (response.ok) {
        toast({
          title: "成功",
          description: "网站基本设置保存成功"
        });
      } else {
        throw new Error('保存失败');
      }
    } catch (error) {
      console.error('保存网站设置失败:', error);
      toast({
        variant: "destructive",
        title: "错误",
        description: "保存网站设置失败"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">网站基本设置</h1>

      <div className="mb-8 flex flex-wrap gap-4">
        <a
          href="/admin/settings/general"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          基本设置
        </a>
        <a
          href="/admin/settings"
          className="px-4 py-2 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
        >
          联系与打赏
        </a>
        <a
          href="/admin/settings/scripts"
          className="px-4 py-2 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
        >
          脚本管理
        </a>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">网站基本信息</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            网站名称
          </label>
          <Input
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            placeholder="例如：向阳乔木的个人博客"
            className="w-full"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            网站描述
          </label>
          <Textarea
            value={siteDescription}
            onChange={(e) => setSiteDescription(e.target.value)}
            placeholder="简短描述您的网站"
            className="w-full"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">Hero区域设置</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            主标题
          </label>
          <Input
            value={heroTitle}
            onChange={(e) => setHeroTitle(e.target.value)}
            placeholder="例如：向阳乔木个人网站"
            className="w-full"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            副标题
          </label>
          <Input
            value={heroSubtitle}
            onChange={(e) => setHeroSubtitle(e.target.value)}
            placeholder="例如：分享AI探索、实践，精选各类工具，一起学习进步。"
            className="w-full"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">社交媒体链接</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          请使用JSON格式添加社交媒体链接，例如：
          <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
            {`[{"name":"Twitter","url":"https://twitter.com/username"},{"name":"GitHub","url":"https://github.com/username"}]`}
          </code>
        </p>

        <div className="mb-4">
          <Textarea
            value={socialLinks}
            onChange={(e) => setSocialLinks(e.target.value)}
            placeholder='[{"name":"Twitter","url":"https://twitter.com/username"},{"name":"GitHub","url":"https://github.com/username"}]'
            className="w-full h-32 font-mono text-sm"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">底部推荐链接</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          请使用JSON格式添加底部推荐链接，例如：
          <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
            {`[{"name":"AI&阅读社群","url":"https://link.qiaomu.ai"},{"name":"AI网址导航","url":"https://daohang.qiaomu.ai"}]`}
          </code>
        </p>

        <div className="mb-4">
          <Textarea
            value={footerLinks}
            onChange={(e) => setFooterLinks(e.target.value)}
            placeholder='[{"name":"AI&阅读社群","url":"https://link.qiaomu.ai"},{"name":"AI网址导航","url":"https://daohang.qiaomu.ai"}]'
            className="w-full h-32 font-mono text-sm"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={saveSettings}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? '保存中...' : '保存设置'}
        </button>
      </div>
    </div>
  );
}
