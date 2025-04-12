'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { FileText, Tag, Eye, TrendingUp, Clock, FolderOpen, Menu, Settings } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    posts: 0,
    categories: 0,
    tags: 0,
    views: 0,
    recentPosts: []
  });

  useEffect(() => {
    // 获取统计数据
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('获取统计数据失败:', error);
      }
    };

    fetchStats();
  }, []);

  // 快速访问链接
  const quickLinks = [
    { title: '写新文章', href: '/admin/posts/new', icon: FileText, color: 'bg-blue-100 text-blue-700' },
    { title: '管理分类', href: '/admin/categories', icon: FolderOpen, color: 'bg-green-100 text-green-700' },
    { title: '管理标签', href: '/admin/tags', icon: Tag, color: 'bg-amber-100 text-amber-700' },
    { title: '管理菜单', href: '/admin/menus', icon: Menu, color: 'bg-purple-100 text-purple-700' },
    { title: '系统设置', href: '/admin/settings', icon: Settings, color: 'bg-slate-100 text-slate-700' },
  ];

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold">仪表盘</h1>
        <Link href="/admin/posts/new">
          <Button>
            写新文章
          </Button>
        </Link>
      </div>

      {/* 快速访问区域 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {quickLinks.map((link, index) => (
          <Link href={link.href} key={index}>
            <Card className="hover:shadow-md transition-shadow h-full">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <div className={`p-3 rounded-full ${link.color} mb-2`}>
                  <link.icon className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium">{link.title}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">文章数量</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.posts}</div>
            <p className="text-xs text-muted-foreground">
              <Link href="/admin/posts" className="text-primary hover:underline">管理所有文章</Link>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">分类数量</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.categories}</div>
            <p className="text-xs text-muted-foreground">
              <Link href="/admin/categories" className="text-primary hover:underline">管理分类</Link>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">标签数量</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.tags}</div>
            <p className="text-xs text-muted-foreground">
              <Link href="/admin/tags" className="text-primary hover:underline">管理标签</Link>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">总浏览量</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.views}</div>
            <p className="text-xs text-muted-foreground">
              网站总访问量
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>最近文章</CardTitle>
            <CardDescription>
              最近发布的文章
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentPosts.length > 0 ? (
                stats.recentPosts.map((post, i) => (
                  <div key={post.id} className="flex items-center">
                    <div className="flex-1 space-y-1">
                      <Link href={`/admin/posts/${post.id}`} className="text-sm font-medium leading-none hover:underline">
                        {post.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        <Clock className="mr-1 inline-block h-3 w-3" />
                        {new Date(post.publishDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {post.views || 0} 浏览
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  暂无文章
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>快速操作</CardTitle>
            <CardDescription>
              常用功能快速访问
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link href="/admin/posts/new">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  写新文章
                </Button>
              </Link>
              <Link href="/admin/categories/new">
                <Button variant="outline" className="w-full justify-start">
                  <FolderOpen className="mr-2 h-4 w-4" />
                  创建分类
                </Button>
              </Link>
              <Link href="/admin/tags/new">
                <Button variant="outline" className="w-full justify-start">
                  <Tag className="mr-2 h-4 w-4" />
                  创建标签
                </Button>
              </Link>
              <Link href="/admin/settings">
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="mr-2 h-4 w-4" />
                  系统设置
                </Button>
              </Link>
              <Link href="/" target="_blank">
                <Button variant="outline" className="w-full justify-start">
                  <Eye className="mr-2 h-4 w-4" />
                  查看网站
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>系统信息</CardTitle>
          <CardDescription>
            博客系统基本信息
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">系统版本</span>
                <span className="text-sm">1.0.0</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Next.js 版本</span>
                <span className="text-sm">14.0.0</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">数据库</span>
                <span className="text-sm">SQLite</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">上次更新</span>
                <span className="text-sm">{new Date().toLocaleDateString()}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">服务器状态</span>
                <span className="text-sm text-green-500">正常</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">环境</span>
                <span className="text-sm">开发环境</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Node.js 版本</span>
                <span className="text-sm">18.x</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">React 版本</span>
                <span className="text-sm">18.x</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Tailwind CSS</span>
                <span className="text-sm">3.x</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
