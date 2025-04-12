'use client';

import Link from 'next/link';
import { useState } from 'react';

type PostCardProps = {
  post: {
    id: number;
    title: string;
    slug: string;
    excerpt?: string | null;
    createdAt?: string | null;
    authorEmail?: string | null;
    categoryName?: string | null;
    coverImage?: string | null;
    pinned?: number | null;
  };
  featured?: boolean;
};

export default function PostCard({ post, featured = false }: PostCardProps) {
  const [imageError, setImageError] = useState(false);
  
  const formattedDate = post.createdAt 
    ? new Date(post.createdAt).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : '';
    
  // 确保pinned是布尔值，避免隐式类型转换问题
  const isPinned = post.pinned === 1;

  return (
    <article className={`
      bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300
      border border-gray-100 dark:border-gray-700 h-full flex flex-col
      ${featured ? 'lg:flex-row' : ''}
    `}>
      {post.coverImage && (
        <div className={`
          relative overflow-hidden
          ${featured ? 'lg:w-2/5 h-60 lg:h-auto' : 'h-48'}
        `}>
          <Link href={`/posts/${post.slug}`} className="block h-full">
            <div className="relative w-full h-full bg-gray-200 dark:bg-gray-700">
              {!imageError ? (
                <img
                  src={post.coverImage}
                  alt={String(post.title)}
                  className="object-cover w-full h-full transition-transform hover:scale-105"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>
          </Link>
          {isPinned && (
            <div className="absolute top-2 left-2 bg-primary-600 text-white text-xs px-2 py-1 rounded-full font-medium">
              置顶
            </div>
          )}
        </div>
      )}
      
      <div className={`p-5 ${featured && post.coverImage ? 'lg:w-3/5' : 'w-full'} flex flex-col flex-grow`}>
        <div className="flex-grow">
          {!post.coverImage && isPinned && (
            <div className="inline-block bg-primary-600 text-white text-xs px-2 py-1 rounded-full font-medium mb-3">
              置顶
            </div>
          )}
          
          {post.categoryName && (
            <Link 
              href={`/categories/${post.categoryName}`}
              className="text-xs font-medium text-primary-600 dark:text-primary-400 uppercase tracking-wider mb-2 inline-block"
            >
              {post.categoryName}
            </Link>
          )}
          
          <Link href={`/posts/${post.slug}`} className="block group">
            <h2 className={`
              font-serif font-bold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors
              ${featured ? 'text-2xl md:text-3xl' : 'text-xl'}
              mb-2
            `}>
              {String(post.title)}
            </h2>
          </Link>
          
          {post.excerpt && (
            <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3 text-sm">
              {post.excerpt}
            </p>
          )}
        </div>
        
        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-4">
          {post.authorEmail && (
            <>
              <span>{post.authorEmail.split('@')[0]}</span>
              <span className="mx-2">•</span>
            </>
          )}
          {formattedDate && (
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formattedDate}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
