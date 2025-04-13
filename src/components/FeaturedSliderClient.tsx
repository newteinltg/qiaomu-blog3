'use client';

import { useState, useEffect } from 'react';
import FeaturedSlider from './FeaturedSlider';
import { Post } from '@/types';

export default function FeaturedSliderClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    const fetchFeaturedPosts = async () => {
      setLoading(true);
      setError(null);

      try {
        // 添加时间戳参数，确保每次都获取最新数据
        const timestamp = Date.now();
        const response = await fetch(`/api/posts?pinned=1&limit=5&_t=${timestamp}`, {
          // 禁用缓存，确保获取最新数据
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch featured posts: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Featured Posts API Response:', data); // 调试日志
        
        // 确保数据有效
        if (!data || !data.posts || !Array.isArray(data.posts)) {
          console.error('Invalid data format:', data);
          throw new Error('Invalid data format received from API');
        }
        
        // 转换数据以匹配Post类型
        const formattedPosts: Post[] = data.posts.map((post: any) => ({
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          coverImage: post.coverImage,
          createdAt: post.createdAt,
          pinned: typeof post.pinned === 'boolean' ? post.pinned : Boolean(post.pinned),
          author: post.author ? {
            id: post.author.id,
            email: post.author.email || null
          } : undefined,
          category: post.category ? {
            id: post.category.id,
            name: post.category.name || null,
            slug: post.category.slug || null
          } : undefined,
          tags: Array.isArray(post.tags) ? post.tags.map((tag: any) => ({
            id: tag.id,
            name: tag.name,
            slug: tag.slug
          })) : undefined
        }));
        
        setPosts(formattedPosts);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching featured posts:', error);
        setError(error instanceof Error ? error.message : String(error));
        setLoading(false);
      }
    };

    fetchFeaturedPosts();

    // 设置定期刷新，每60秒刷新一次数据
    const refreshInterval = setInterval(fetchFeaturedPosts, 60000);

    return () => clearInterval(refreshInterval);
  }, []);

  if (loading && posts.length === 0) {
    return null; // 不显示加载状态，避免闪烁
  }

  if (error || posts.length === 0) {
    return null; // 如果出错或没有置顶文章，不显示轮播
  }

  return <FeaturedSlider posts={posts} />;
}
