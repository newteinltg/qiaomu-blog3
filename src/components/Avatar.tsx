'use client';

import { useState } from 'react';

type AvatarProps = {
  src: string;
  alt: string;
  className?: string;
  fallbackText?: string;
};

export default function Avatar({ 
  src, 
  alt, 
  className = "w-full h-full object-cover",
  fallbackText
}: AvatarProps) {
  const [error, setError] = useState(false);
  
  // 生成SVG占位符
  const generateFallbackSvg = () => {
    const text = fallbackText || alt;
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f0f0f0'/%3E%3Ctext x='50' y='50' font-family='Arial' font-size='20' text-anchor='middle' dominant-baseline='middle' fill='%23999'%3E${encodeURIComponent(text)}%3C/text%3E%3C/svg%3E`;
  };

  return (
    <img 
      src={error ? generateFallbackSvg() : src} 
      alt={alt} 
      className={className}
      onError={() => setError(true)}
    />
  );
}
