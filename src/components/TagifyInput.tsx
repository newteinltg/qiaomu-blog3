'use client';

import React, { useState, useEffect, useRef } from 'react';
import Tagify from '@yaireo/tagify';
import '@yaireo/tagify/dist/tagify.css';

interface TagifyInputProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  whitelist?: Array<{ id: number; name: string; value?: string }> | null | undefined | object;
  loading?: boolean;
}

export default function TagifyInput({
  value = '',
  onChange,
  placeholder = '添加标签...',
  className = '',
  whitelist = [],
  loading = false
}: TagifyInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const tagifyRef = useRef<Tagify | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [initialValueSet, setInitialValueSet] = useState(false);

  // 格式化白名单数据，确保格式一致
  const formattedWhitelist = React.useMemo(() => {
    // 检查 whitelist 是否为有效数组
    if (!whitelist) {
      return [];
    }

    if (!Array.isArray(whitelist)) {
      return [];
    }

    if (whitelist.length === 0) {
      return [];
    }

    // 确保每个项目都有正确的格式
    return whitelist.filter(item => item && typeof item === 'object').map(item => {
      // 检查是否有 name 属性（API 返回的标签数据）
      if ('name' in item) {
        return {
          value: item.name,
          id: item.id
        };
      }
      // 检查是否已经是 Tagify 格式（有 value 属性）
      else if ('value' in item) {
        return {
          value: item.value,
          id: item.id
        };
      }
      // 默认情况，尝试使用任何可用属性
      return {
        value: String(item.name || item.value || item.title || '未知标签'),
        id: item.id
      };
    });
  }, [whitelist]);

  // 搜索标签
  const searchTags = async (query: string) => {
    if (!query || typeof query !== 'string') {
      return;
    }

    try {
      setIsSearching(true);

      const response = await fetch(`/api/tags?search=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error('搜索标签失败');
      }

      const result = await response.json();
      const tags = result.data || [];

      // 更新 Tagify 实例的白名单
      if (tagifyRef.current) {
        // 格式化搜索结果
        const searchResults = tags.map((tag: any) => ({
          value: tag.name,
          id: tag.id
        }));

        // 更新白名单
        const newWhitelist = [...formattedWhitelist, ...searchResults];

        // 去重
        const uniqueWhitelist = Array.from(
          new Map(newWhitelist.map(item => [item.id, item])).values()
        );

        // 设置白名单
        tagifyRef.current.settings.whitelist = uniqueWhitelist;

        // 刷新下拉菜单
        try {
          // @ts-ignore - Tagify 类型定义不完整
          tagifyRef.current.dropdown.show(query);
        } catch (err) {
          console.error('显示下拉菜单出错:', err);
        }
      }
    } catch (error) {
      console.error('搜索标签出错:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // 初始化 Tagify
  useEffect(() => {
    if (!inputRef.current) return;

    // 销毁之前的实例
    if (tagifyRef.current) {
      tagifyRef.current.destroy();
    }

    const settings = {
      enforceWhitelist: false,
      maxTags: 10,
      backspace: 'edit',
      placeholder,
      editTags: true, // 允许编辑标签
      dropdown: {
        enabled: 0,            // 设置为0，表示在输入框获得焦点时就显示下拉菜单
        maxItems: 20,          // 最多显示20个项目
        position: 'text',      // 将下拉菜单放在光标位置
        closeOnSelect: true,   // 选择后关闭下拉菜单
        highlightFirst: true,  // 高亮第一个匹配项
        fuzzySearch: true,     // 启用模糊搜索
        searchKeys: ["value"]  // 搜索键
      },
      whitelist: formattedWhitelist,
      templates: {
        dropdownItemNoMatch(data: { value: string }) {
          return `
            <div class='tagify__dropdown__item'>
              <span>创建新标签: </span>
              <strong class="tagify__dropdown__item--create">${data.value}</strong>
            </div>
          `;
        }
      }
    };

    // 创建 Tagify 实例
    tagifyRef.current = new Tagify(inputRef.current, settings);

    // 添加事件监听器
    tagifyRef.current.on('add', handleTagChange);
    tagifyRef.current.on('remove', handleTagChange);
    tagifyRef.current.on('input', handleInput);
    tagifyRef.current.on('focus', handleFocus);
    tagifyRef.current.on('blur', handleTagChange);
    tagifyRef.current.on('edit:updated', handleTagChange); // 使用 edit:updated 事件代替 edit 事件
    tagifyRef.current.on('invalid', handleInvalid);

    // 设置初始值
    setInitialValueSet(false);

    return () => {
      if (tagifyRef.current) {
        tagifyRef.current.destroy();
      }
    };
  }, [formattedWhitelist, placeholder]);

  // 处理初始值
  useEffect(() => {
    if (!tagifyRef.current || initialValueSet || !value) return;

    try {
      const parsedValue = JSON.parse(value);
      if (Array.isArray(parsedValue)) {
        // 清空现有标签
        tagifyRef.current.removeAllTags();

        // 只有当有标签时才添加
        if (parsedValue.length > 0) {
          // 添加标签
          tagifyRef.current.addTags(parsedValue);
        }

        setInitialValueSet(true);
      }
    } catch (e) {
      console.error('Error parsing initial value:', e);
      // 如果解析失败，仍然标记为已设置初始值，避免重复尝试
      setInitialValueSet(true);
    }
  }, [value, initialValueSet]);

  // 处理标签变化
  function handleTagChange(e: CustomEvent) {
    if (!tagifyRef.current) return;

    try {
      // 防止在标签值为空或无效时出错
      const tagsValue = tagifyRef.current.value || [];
      const tagsJson = JSON.stringify(tagsValue);
      onChange(tagsJson);
    } catch (error) {
      console.error('处理标签变化时出错:', error);
      // 返回空数组作为默认值
      onChange(JSON.stringify([]));
    }
  }

  // 处理输入事件
  function handleInput(e: CustomEvent) {
    const input = e.detail.value;

    // 执行搜索
    searchTags(input);
  }

  // 处理焦点事件
  function handleFocus(e: CustomEvent) {
    // 获取所有标签
    searchTags('');

    // 显示下拉菜单
    if (tagifyRef.current && formattedWhitelist.length > 0) {
      setTimeout(() => {
        try {
          // @ts-ignore - Tagify 类型定义不完整
          tagifyRef.current?.dropdown.show('');
        } catch (err) {
          console.error('焦点事件显示下拉菜单出错:', err);
        }
      }, 100);
    }
  }

  // 处理无效标签
  function handleInvalid(e: CustomEvent) {
    console.warn('无效标签:', e.detail);
  }

  return (
    <div className={`tagify-wrapper ${loading ? 'opacity-50' : ''}`}>
      <input
        ref={inputRef}
        className={`tagify-input ${className}`}
        disabled={loading}
      />

      {/* 搜索状态指示器 */}
      {isSearching && (
        <div className="search-indicator">
          <span className="loading-spinner"></span>
          <span className="search-text">搜索中...</span>
        </div>
      )}

      <style jsx>{`
        .tagify-wrapper {
          position: relative;
          width: 100%;
        }
        .tagify-input {
          width: 100%;
          min-height: 40px;
          border: 1px solid #e2e8f0;
          border-radius: 0.375rem;
          padding: 0.5rem;
          transition: border-color 0.15s ease-in-out;
        }
        .search-indicator {
          position: absolute;
          right: 10px;
          top: 10px;
          display: flex;
          align-items: center;
          font-size: 12px;
          color: #666;
        }
        .loading-spinner {
          display: inline-block;
          width: 12px;
          height: 12px;
          border: 2px solid rgba(0, 0, 0, 0.1);
          border-top-color: #3b82f6;
          border-radius: 50%;
          margin-right: 5px;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        .search-text {
          font-size: 11px;
        }
        :global(.tagify) {
          --tag-bg: #3b82f6;
          --tag-text-color: white;
          --tag-hover: #2563eb;
          --tag-remove-bg: #1e40af;
          --tag-remove-btn-color: white;
          width: 100%;
        }
        :global(.tagify__dropdown) {
          max-height: 200px;
          overflow-y: auto;
          z-index: 999 !important;
        }
        :global(.tagify__dropdown__item--create) {
          color: #3b82f6;
        }
        :global(.tagify__dropdown__item--active) {
          background-color: #dbeafe;
          color: #1e40af;
        }
      `}</style>
    </div>
  );
}
