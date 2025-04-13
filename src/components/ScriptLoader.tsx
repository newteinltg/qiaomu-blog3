"use client";

import React from 'react';

type ScriptLoaderProps = {
  position: 'head' | 'body_start' | 'body_end';
  key?: string;
};

/**
 * 简化版ScriptLoader组件
 * 为了避免与动态渲染冲突，暂时禁用脚本加载功能
 */
export default function ScriptLoader({ position }: ScriptLoaderProps) {
  // 在服务器端渲染时返回null
  if (typeof window === 'undefined') {
    return null;
  }
  
  // 暂时返回空元素，避免与动态渲染冲突
  return null;
}
