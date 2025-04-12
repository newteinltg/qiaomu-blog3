'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useToast } from '@/components/ui/use-toast';

// 动态导入编辑器组件
const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default),
  { ssr: false }
);

// 创建一个样式隔离组件
const IsolatedStyles = () => {
  useEffect(() => {
    // 在组件挂载时注入样式
    const style = document.createElement('style');
    style.setAttribute('id', 'isolated-markdown-styles');
    style.innerHTML = `
      /* 编辑器基本样式 */
      .isolated-markdown .w-md-editor {
        text-align: left;
        border-radius: 3px;
        padding: 0;
        position: relative;
        color: #000;
        background-color: #fff;
        border: 1px solid #ddd;
      }

      /* 编辑区域 */
      .isolated-markdown .w-md-editor-text-input {
        color: #333 !important;
        -webkit-text-fill-color: #333 !important;
        background-color: #fff;
        caret-color: #333;
      }

      /* 暗色模式 */
      .dark .isolated-markdown .w-md-editor {
        color: #c9d1d9;
        background-color: #0d1117;
        border-color: #30363d;
      }

      .dark .isolated-markdown .w-md-editor-text-input {
        color: #c9d1d9 !important;
        -webkit-text-fill-color: #c9d1d9 !important;
        background-color: #0d1117;
        caret-color: #c9d1d9;
      }

      /* 确保文本可见 */
      .isolated-markdown textarea {
        color: #333 !important;
        opacity: 1 !important;
      }

      .dark .isolated-markdown textarea {
        color: #c9d1d9 !important;
        opacity: 1 !important;
      }

      /* 全屏模式样式 - 修复全屏按钮不生效的问题 */
      .w-md-editor-fullscreen {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        z-index: 99999 !important;
        background-color: #fff !important;
        border-radius: 0 !important;
        border: none !important;
      }

      .dark .w-md-editor-fullscreen {
        background-color: #0d1117 !important;
      }

      /* 确保全屏模式下的内容区域有正确的高度 */
      .w-md-editor-fullscreen .w-md-editor-content {
        height: calc(100% - 40px) !important;
      }

      /* 确保全屏模式下的文本颜色正确 */
      .w-md-editor-fullscreen .w-md-editor-text-input {
        color: #333 !important;
        -webkit-text-fill-color: #333 !important;
        caret-color: #333 !important;
      }

      .dark .w-md-editor-fullscreen .w-md-editor-text-input {
        color: #c9d1d9 !important;
        -webkit-text-fill-color: #c9d1d9 !important;
        caret-color: #c9d1d9 !important;
      }
    `;
    document.head.appendChild(style);

    // 清理函数
    return () => {
      const existingStyle = document.getElementById('isolated-markdown-styles');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  return null;
};

interface IsolatedMarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: number;
}

export default function IsolatedMarkdownEditor({
  value,
  onChange,
  height = 600
}: IsolatedMarkdownEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // 在组件加载时标记已加载状态
  useEffect(() => {
    setIsLoaded(true);
    return () => setIsLoaded(false);
  }, []);

  // 处理全屏模式切换
  useEffect(() => {
    // 监听全屏按钮点击
    const handleFullscreenToggle = () => {
      // 强制刷新编辑器大小，确保全屏模式正确显示
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 100);
    };

    // 查找全屏按钮并添加点击事件
    const fullscreenButton = document.querySelector('.w-md-editor-toolbar button[data-name="fullscreen"]');
    if (fullscreenButton) {
      fullscreenButton.addEventListener('click', handleFullscreenToggle);
    }

    return () => {
      if (fullscreenButton) {
        fullscreenButton.removeEventListener('click', handleFullscreenToggle);
      }
    };
  }, [isLoaded]);

  // 处理粘贴事件
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      try {
        // 检查是否在编辑器内粘贴
        const isEditorFocused = document.activeElement?.closest('.w-md-editor');
        if (!isEditorFocused) return;

        // 检查剪贴板是否包含图片
        const items = e.clipboardData?.items;
        if (!items) return;

        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            e.preventDefault(); // 阻止默认粘贴行为

            const file = items[i].getAsFile();
            if (!file) continue;

            try {
              setIsUploading(true);
              toast({
                title: "上传中",
                description: "正在上传并插入图片到编辑器...",
              });

              // 上传图片
              const formData = new FormData();
              formData.append('file', file);

              // 添加错误处理和超时设置
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时

              const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
                signal: controller.signal
              });

              clearTimeout(timeoutId);

              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '上传失败');
              }

              const data = await response.json();

              if (!data.success || !data.file || !data.file.url) {
                throw new Error('服务器响应格式错误');
              }

              // 在光标位置插入Markdown图片语法
              const imageMarkdown = `![${file.name || '图片'}](${data.file.url})`;

              // 获取当前光标位置并插入图片
              const textArea = document.querySelector('.w-md-editor-text-input') as HTMLTextAreaElement;
              if (textArea) {
                const startPos = textArea.selectionStart;
                const endPos = textArea.selectionEnd;
                const newValue = value.substring(0, startPos) + imageMarkdown + value.substring(endPos);
                onChange(newValue);

                // 设置光标位置到图片后
                setTimeout(() => {
                  textArea.selectionStart = startPos + imageMarkdown.length;
                  textArea.selectionEnd = startPos + imageMarkdown.length;
                  textArea.focus();
                }, 0);
              } else {
                // 如果无法获取光标位置，则追加到内容末尾
                onChange(value + '\n\n' + imageMarkdown);
              }

              toast({
                title: "上传成功",
                description: "图片已成功插入到编辑器内容中",
              });
            } catch (err: any) {
              console.error('上传图片失败:', err);
              toast({
                title: "上传失败",
                description: err.message || "图片上传失败，请重试",
                variant: "destructive",
              });
            } finally {
              setIsUploading(false);
            }

            break; // 只处理第一个图片
          }
        }
      } catch (error) {
        console.error('处理粘贴事件时出错:', error);
        toast({
          title: "粘贴处理错误",
          description: "处理粘贴内容时出现错误",
          variant: "destructive",
        });
      }
    };

    // 添加粘贴事件监听器
    document.addEventListener('paste', handlePaste);

    // 清理函数
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [value, onChange, toast]);

  return (
    <div ref={editorRef} className="isolated-markdown">
      {/* 注入隔离样式 */}
      <IsolatedStyles />

      {typeof window !== 'undefined' && isLoaded ? (
        <div style={{
          position: 'relative',
          border: '1px solid #ddd',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          {isUploading && (
            <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center z-10">
              <div className="bg-white p-4 rounded-md shadow-lg">
                <div className="flex items-center space-x-2">
                  <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>正在上传图片...</span>
                </div>
              </div>
            </div>
          )}
          <MDEditor
            value={value}
            onChange={(val) => onChange(val || '')}
            height={height}
            data-color-mode="light"
            preview="live"
            visibleDragbar={true}
            hideToolbar={false}
            textareaProps={{
              placeholder: '在此输入文章内容...',
              style: {
                color: '#333',
                caretColor: '#333',
                WebkitTextFillColor: '#333'
              }
            }}
          />
        </div>
      ) : (
        <div className="border p-4 rounded-md bg-gray-50 h-[600px] flex items-center justify-center">
          <p className="text-gray-500">正在加载 Markdown 编辑器...</p>
        </div>
      )}

      <p className="text-xs text-gray-500 mt-1">
        将光标放在编辑器中，然后直接粘贴图片（Ctrl+V / Cmd+V）即可插入图片
      </p>
    </div>
  );
}
