"use client";

import React from 'react';

type ScriptLoaderProps = {
  position: 'head' | 'body_start' | 'body_end';
  key?: string;
};

/**
 * 简化版ScriptLoader组件
 * 使用 fetchCache = 'force-no-store' 配置代替 dynamic = 'force-dynamic'
 * 这种方法在数据获取层面禁用缓存，而不是渲染层面，因此不会与客户端组件冲突
 */
export default function ScriptLoader({ position }: ScriptLoaderProps) {
  // 在服务器端渲染时返回null
  if (typeof window === 'undefined') {
    return null;
  }
  
  // 暂时返回空元素，避免与动态渲染冲突
  return null;
}
