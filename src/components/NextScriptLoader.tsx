"use client";

import React, { useEffect } from 'react';
import Script from 'next/script';

type NextScriptLoaderProps = {
  position: 'head' | 'body_start' | 'body_end';
};

/**
 * 改进版脚本加载组件
 * 使用 Next.js 的 Script 组件加载脚本，与动态渲染兼容
 */
export default function NextScriptLoader({ position }: NextScriptLoaderProps) {
  const [scripts, setScripts] = React.useState<{ id: number; content: string; position: string }[]>([]);

  useEffect(() => {
    // 在客户端获取脚本
    const fetchScripts = async () => {
      try {
        // 使用fetch API获取脚本，而不是直接使用db
        const response = await fetch(`/api/settings/scripts/position?position=${position}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && Array.isArray(data.scripts)) {
            setScripts(data.scripts);
          }
        }
      } catch (error) {
        console.error('获取脚本失败:', error);
      }
    };

    fetchScripts();
  }, [position]);

  return (
    <>
      {scripts.map((script) => (
        <Script
          key={`script-${script.id}`}
          id={`script-${script.id}`}
          dangerouslySetInnerHTML={{ __html: script.content }}
          strategy="afterInteractive"
        />
      ))}
    </>
  );
}
