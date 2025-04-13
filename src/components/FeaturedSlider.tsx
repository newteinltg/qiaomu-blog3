'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Post } from '@/types';

type FeaturedSliderProps = {
  posts: Post[];
};

const FeaturedSlider = ({ posts }: FeaturedSliderProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = posts.length;

  // 自动轮播
  useEffect(() => {
    if (totalSlides <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 9000); // 增加停留时间到9秒

    return () => clearInterval(interval);
  }, [totalSlides]);

  // 处理手动导航
  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  if (!posts || posts.length === 0) {
    return null;
  }

  // 获取当前幻灯片
  const currentPost = posts[currentSlide];

  return (
    <div className="featured-slider relative overflow-hidden rounded-xl shadow-lg" style={{ height: '400px' }}>
      {/* 当前幻灯片 - 整个幻灯片可点击 */}
      <Link href={`/posts/${currentPost.slug}`} className="slide w-full h-full relative block">
        {/* 文章封面图 */}
        {currentPost.coverImage && currentPost.coverImage.trim() ? (
          <img
            src={String(currentPost.coverImage)}
            alt={String(currentPost.title)}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <svg className="w-24 h-24 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 2v8l4-2 4 4 4-4 4 2V6H4z" />
            </svg>
          </div>
        )}

        {/* 渐变遮罩 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>

        {/* 文章信息 */}
        <div className="slide-content absolute bottom-0 left-0 right-0 p-6 text-white">
          {currentPost.category?.name && (
            <span className="slide-category inline-block bg-primary-600 text-white text-xs font-medium px-2.5 py-1 rounded mb-2">
              {currentPost.category.name}
            </span>
          )}

          <h2 className="slide-title text-2xl md:text-3xl font-bold mb-2 hover:text-primary-400 transition-colors">
            {String(currentPost.title)}
          </h2>

          {currentPost.excerpt && (
            <p className="slide-description text-sm md:text-base text-gray-200 mb-4 line-clamp-2">
              {currentPost.excerpt}
            </p>
          )}

          <div className="flex items-center text-sm">
            <span className="text-gray-300">
              {new Date(currentPost.createdAt).toLocaleDateString('zh-CN')}
            </span>
          </div>
        </div>
      </Link>

      {/* 导航控件 */}
      {posts.length > 1 && (
        <>
          {/* 箭头控件 */}
          <div className="slider-controls absolute bottom-4 right-4 flex gap-2 z-10">
            <button
              className="slider-control w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center hover:bg-white/30 transition-colors"
              aria-label="上一篇"
              onClick={handlePrev}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"></path>
              </svg>
            </button>

            <button
              className="slider-control w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center hover:bg-white/30 transition-colors"
              aria-label="下一篇"
              onClick={handleNext}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"></path>
              </svg>
            </button>
          </div>

          {/* 指示点 */}
          <div className="slider-dots absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
            {posts.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-all ${index === currentSlide ? 'bg-white scale-125' : 'bg-white/50'}`}
                aria-label={`跳转到第 ${index + 1} 张幻灯片`}
                onClick={() => setCurrentSlide(index)}
              ></button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default FeaturedSlider;
