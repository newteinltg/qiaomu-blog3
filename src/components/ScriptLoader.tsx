"use client";

import { useEffect, useState, Fragment, createElement } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';

type Script = {
  id: number;
  name: string;
  code: string;
  type: string;
  isActive: number;
  position: string;
  pages: string | null;
  order: number;
};

type ScriptLoaderProps = {
  position: 'head' | 'body_start' | 'body_end';
};

export default function ScriptLoader({ position }: ScriptLoaderProps) {
  const [scripts, setScripts] = useState<Script[]>([]);
  const pathname = usePathname();

  // 添加一个状态来跟踪是否已经加载脚本
  const [loaded, setLoaded] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 使用客户端组件标记
  const isClient = typeof window !== 'undefined';

  useEffect(() => {
    if (!isClient) {
      console.log(`ScriptLoader(${position}): 服务器端渲染，跳过获取脚本`);
      return;
    }

    console.log(`ScriptLoader(${position}): 初始化组件 (客户端)`);

    const fetchScripts = async () => {
      try {
        console.log(`ScriptLoader(${position}): 开始获取脚本`);
        // 使用绝对URL确保请求正确发送
        const baseUrl = window.location.origin;
        const apiUrl = `${baseUrl}/api/settings/scripts`;
        console.log(`ScriptLoader(${position}): 请求URL:`, apiUrl);

        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          }
        });
        console.log(`ScriptLoader(${position}): 获取到响应状态:`, response.status);

        if (response.ok) {
          const data = await response.json();
          console.log(`ScriptLoader(${position}): 获取脚本响应:`, data);

          if (data.success) {
            console.log(`ScriptLoader(${position}): 设置脚本数据:`, data.data.scripts);
            // 检查脚本数据
            if (data.data.scripts && data.data.scripts.length > 0) {
              console.log(`ScriptLoader(${position}): 有 ${data.data.scripts.length} 个脚本可用`);
              // 检查当前位置的脚本
              const positionScripts = data.data.scripts.filter((s: Script) => s.position === position);
              console.log(`ScriptLoader(${position}): 当前位置的脚本数量: ${positionScripts.length}`);
              if (positionScripts.length > 0) {
                console.log(`ScriptLoader(${position}): 当前位置的脚本:`, positionScripts);
              }

              // 设置脚本数据
              setScripts(data.data.scripts);
              console.log(`ScriptLoader(${position}): 已设置脚本数据，检查状态:`, data.data.scripts);

              // 标记为已加载
              setLoaded(true);
              console.log(`ScriptLoader(${position}): 标记为已加载`);
            } else {
              console.log(`ScriptLoader(${position}): 没有可用的脚本`);
              setLoaded(true); // 即使没有脚本，也标记为已加载
            }
          } else {
            console.error(`ScriptLoader(${position}): 响应成功但数据不成功:`, data);
            setError('API响应成功但数据不成功');
          }
        } else {
          console.error(`ScriptLoader(${position}): 获取脚本失败, 状态码:`, response.status);
          setError(`获取脚本失败, 状态码: ${response.status}`);
        }
      } catch (error) {
        console.error(`ScriptLoader(${position}): 获取脚本失败:`, error);
        setError(`获取脚本失败: ${error}`);
      }
    };

    fetchScripts();

    // 清理函数
    return () => {
      console.log(`ScriptLoader(${position}): 组件卸载`);
    };
  }, [position, isClient]);

  // 过滤出当前位置和活跃状态的脚本
  console.log(`ScriptLoader(${position}): 开始过滤脚本, 共 ${scripts.length} 个脚本`);

  const filteredScripts = scripts.filter((script: Script) => {
    console.log(`ScriptLoader(${position}): 处理脚本 ID ${script.id}, 名称: ${script.name}`);

    // 检查脚本是否活跃
    if (script.isActive !== 1) {
      console.log(`ScriptLoader(${position}): 脚本 ${script.id} 不活跃, 跳过`);
      return false;
    }

    // 检查脚本位置是否匹配
    if (script.position !== position) {
      console.log(`ScriptLoader(${position}): 脚本 ${script.id} 位置不匹配 (脚本位置: ${script.position}, 当前位置: ${position}), 跳过`);
      return false;
    }

    console.log(`ScriptLoader(${position}): 脚本 ${script.id} 活跃状态和位置匹配成功`);

    // 检查页面路径是否匹配
    if (script.pages) {
      try {
        console.log(`ScriptLoader(${position}): 处理脚本 ${script.id} (${script.name}) 的页面设置`);
        console.log(`ScriptLoader(${position}): 原始页面设置:`, script.pages);
        console.log(`ScriptLoader(${position}): 原始页面设置类型:`, typeof script.pages);

        // 尝试直接解析JSON
        try {
          const directParse = JSON.parse(script.pages);
          console.log(`ScriptLoader(${position}): 直接解析成功:`, directParse);

          // 如果没有指定页面或页面列表为空，则在所有页面上显示
          if (!directParse || directParse.length === 0) {
            console.log(`ScriptLoader(${position}): 页面模式为空，在所有页面上显示`);
            return true;
          }

          // 检查当前路径是否匹配任何模式
          const matches = directParse.some((pattern: string) => {
            if (!pattern) {
              console.log(`ScriptLoader(${position}): 模式为空，跳过`);
              return false;
            }

            // 处理通配符
            if (pattern === '/*') {
              console.log(`ScriptLoader(${position}): 匹配全站模式 /*`);
              return true;
            }
            if (pattern.endsWith('/*')) {
              const prefix = pattern.slice(0, -2);
              const result = pathname.startsWith(prefix);
              console.log(`ScriptLoader(${position}): 前缀匹配 ${pattern}, 当前路径 ${pathname}, 结果: ${result}`);
              return result;
            }
            // 精确匹配
            const result = pathname === pattern;
            console.log(`ScriptLoader(${position}): 精确匹配 ${pattern}, 当前路径 ${pathname}, 结果: ${result}`);
            return result;
          });

          console.log(`ScriptLoader(${position}): 脚本 ${script.id} 匹配结果: ${matches}`);
          return matches;

        } catch (directError) {
          // 直接解析失败，尝试预处理
          console.log(`ScriptLoader(${position}): 直接解析失败，尝试预处理:`, directError);

          // 预处理页面模式字符串，替换中文方括号为英文方括号
          let pagesStr = script.pages
            .replace(/［/g, '[')  // 替换中文左方括号［为[
            .replace(/］/g, ']')  // 替换中文右方括号］为]
            .replace(/【/g, '[')  // 替换中文方括号【为[
            .replace(/】/g, ']')  // 替换中文方括号】为]
            .replace(/｛/g, '{')  // 替换中文花括号｛为{
            .replace(/｝/g, '}')  // 替换中文花括号｝为}
            .replace(/“/g, '"')  // 替换中文引号“为"
            .replace(/”/g, '"')  // 替换中文引号”为"
            .replace(/，/g, ',');  // 替换中文逗号，为,

          console.log(`ScriptLoader(${position}): 替换特殊字符后:`, pagesStr);

          // 检查是否是有效的JSON格式
          if (!pagesStr.startsWith('[') || !pagesStr.endsWith(']')) {
            console.log(`ScriptLoader(${position}): 添加方括号包装`);
            pagesStr = `[${pagesStr}]`;
          }

          console.log(`ScriptLoader(${position}): 最终处理后的页面模式字符串:`, pagesStr);

          try {
            const pagePatterns = JSON.parse(pagesStr) as string[];
            console.log(`ScriptLoader(${position}): 解析后的页面模式:`, pagePatterns);

            // 如果没有指定页面或页面列表为空，则在所有页面上显示
            if (!pagePatterns || pagePatterns.length === 0) {
              console.log(`ScriptLoader(${position}): 页面模式为空，在所有页面上显示`);
              return true;
            }

            // 检查当前路径是否匹配任何模式
            const matches = pagePatterns.some((pattern: string) => {
              if (!pattern) {
                console.log(`ScriptLoader(${position}): 模式为空，跳过`);
                return false;
              }

              // 处理通配符
              if (pattern === '/*') {
                console.log(`ScriptLoader(${position}): 匹配全站模式 /*`);
                return true;
              }
              if (pattern.endsWith('/*')) {
                const prefix = pattern.slice(0, -2);
                const result = pathname.startsWith(prefix);
                console.log(`ScriptLoader(${position}): 前缀匹配 ${pattern}, 当前路径 ${pathname}, 结果: ${result}`);
                return result;
              }
              // 精确匹配
              const result = pathname === pattern;
              console.log(`ScriptLoader(${position}): 精确匹配 ${pattern}, 当前路径 ${pathname}, 结果: ${result}`);
              return result;
            });

            console.log(`ScriptLoader(${position}): 脚本 ${script.id} 匹配结果: ${matches}`);
            return matches;
          } catch (jsonError) {
            console.error(`ScriptLoader(${position}): JSON解析失败:`, jsonError, '\n字符串:', pagesStr);
            return true; // JSON解析失败时默认显示
          }
        }
      } catch (e) {
        // 如果处理过程中出现其他错误，默认在所有页面上显示
        console.error(`ScriptLoader(${position}): 处理页面模式失败:`, e, '\n原始字符串:', script.pages);
        return true;
      }
    }

    // 如果没有指定页面，则在所有页面上显示
    return true;
  });

  // 按顺序排序脚本
  const sortedScripts = [...filteredScripts].sort((a: Script, b: Script) => a.order - b.order);

  console.log(`ScriptLoader(${position}): 当前路径: ${pathname}`);
  console.log(`ScriptLoader(${position}): 过滤后的脚本:`, filteredScripts);
  console.log(`ScriptLoader(${position}): 排序后的脚本:`, sortedScripts);

  // 在head中使用的脚本需要特殊处理
  const renderHeadScript = (script: Script) => {
    console.log(`ScriptLoader(${position}): 渲染head脚本:`, script.id, script.name);

    // 提取脚本代码中的src和其他属性
    const scriptSrcMatch = script.code.match(/src=['"]([^'"]+)['"]/);
    const scriptIdMatch = script.code.match(/data-website-id=['"]([^'"]+)['"]/);

    if (scriptSrcMatch && scriptSrcMatch[1]) {
      // 如果有src属性，使用Next.js的Script组件加载外部脚本
      const src = scriptSrcMatch[1];
      const websiteId = scriptIdMatch ? scriptIdMatch[1] : undefined;

      console.log(`ScriptLoader(${position}): 使用src加载脚本:`, src);

      return (
        <Script
          key={script.id}
          id={`head-script-${script.id}`}
          src={src}
          data-website-id={websiteId}
          strategy="afterInteractive"
        />
      );
    } else {
      // 如果没有src属性，尝试提取脚本内容
      const scriptContentMatch = script.code.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
      const scriptContent = scriptContentMatch ? scriptContentMatch[1] : script.code;

      console.log(`ScriptLoader(${position}): 使用内联脚本内容:`, scriptContent);

      return (
        <Script
          key={script.id}
          id={`head-script-${script.id}`}
          dangerouslySetInnerHTML={{ __html: scriptContent }}
          strategy="afterInteractive"
        />
      );
    }
  };

  // 显示加载状态
  console.log(`ScriptLoader(${position}): 渲染组件, 已加载: ${loaded}, 错误: ${error}, 脚本数量: ${scripts.length}, 过滤后脚本数量: ${sortedScripts.length}`);

  // 如果不是客户端，返回空元素
  if (!isClient) {
    console.log(`ScriptLoader(${position}): 服务器端渲染，返回空元素`);
    return null;
  }

  // 如果有错误，显示错误信息（仅在开发环境下）
  if (error && process.env.NODE_ENV === 'development') {
    console.error(`ScriptLoader(${position}): 错误:`, error);
    return <div style={{ display: 'none' }}>{`ScriptLoader 错误: ${error}`}</div>;
  }

  // 如果没有脚本，返回空元素
  if (sortedScripts.length === 0) {
    console.log(`ScriptLoader(${position}): 没有脚本需要渲染`);
    return null;
  }

  return (
    <>
      {sortedScripts.map((script: Script) => {
        console.log(`ScriptLoader(${position}): 渲染脚本:`, script.id, script.name);

        if (position === 'head') {
          return renderHeadScript(script);
        } else {
          // 对于body位置，可以使用div
          return (
            <div key={script.id} dangerouslySetInnerHTML={{ __html: script.code }} />
          );
        }
      })}
    </>
  );
}
