'use client';

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useToast } from '@/components/ui/use-toast';
import '../styles/markdown-editor.css';
import '../styles/markdown-preview.css';
import '../styles/editor-fix.css'; // 导入修复样式，确保覆盖其他样式

// 注意：不再动态导入样式，而是使用自定义样式

// 动态导入 MDEditor 以避免 SSR 问题
const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => {
    // 确保导入的是默认导出
    return typeof mod.default === 'function' ? mod.default : mod;
  }),
  { ssr: false }
);

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: number;
}

export default function MarkdownEditor({
  value,
  onChange,
  height = 600
}: MarkdownEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  // 处理粘贴事件
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
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
              description: "正在上传粘贴的图片...",
            });

            // 上传图片
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/upload', {
              method: 'POST',
              body: formData,
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || '上传失败');
            }

            const data = await response.json();

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
              description: "图片已插入到编辑器中",
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
    };

    // 添加粘贴事件监听器
    document.addEventListener('paste', handlePaste);

    // 清理函数
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [value, onChange, toast]);

  // 添加错误处理
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // 在组件加载时标记已加载状态
  useEffect(() => {
    setIsLoaded(true);
    return () => setIsLoaded(false);
  }, []);

  return (
    <div ref={editorRef}>
      {/* 使用自定义样式替代动态加载的样式 */}

      {error ? (
        <div className="border border-red-300 rounded-md p-4 bg-red-50">
          <p className="text-red-500">加载编辑器失败: {error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
          >
            重试
          </button>
        </div>
      ) : (
        <>
          {typeof window !== 'undefined' && isLoaded && (
            <div className="markdown-editor-container" style={{ position: 'relative' }}>
              <div className="editor-wrapper" style={{ color: '#333' }}>
                <MDEditor
                  value={value}
                  onChange={(val) => onChange(val || '')}
                  height={height}
                  data-color-mode="auto"
                  preview="live"
                  visibleDragbar={true}
                  hideToolbar={false}
                  textareaProps={{
                    style: {
                      color: '#333',
                      caretColor: '#333',
                      WebkitTextFillColor: '#333'
                    }
                  }}
                />
              </div>
            </div>
          )}
          {(!isLoaded || typeof window === 'undefined') && (
            <div className="border p-4 rounded-md bg-gray-50 h-[600px] flex items-center justify-center">
              <p className="text-gray-500">正在加载 Markdown 编辑器...</p>
            </div>
          )}
          <p className="text-xs text-gray-500 mt-1">
            支持直接粘贴图片（Ctrl+V / Cmd+V）到编辑器中
          </p>
        </>
      )}
    </div>
  );
}
