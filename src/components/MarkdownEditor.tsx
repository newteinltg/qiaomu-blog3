'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
// import { useToast } from '@/components/ui/use-toast'; // Uncomment if needed for notifications

const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => {
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
  // const { toast } = useToast(); // Uncomment if needed for notifications

  // 处理粘贴事件
  const handlePaste = (e: ClipboardEvent) => {
    const text = e.clipboardData?.getData('text');
    if (!text) return;

    // 检查是否是URL
    const urlRegex = /^(https?:\/\/[^\s]+)$/;
    if (urlRegex.test(text)) {
      e.preventDefault();

      const textArea = e.target as HTMLTextAreaElement;
      const startPos = textArea.selectionStart;
      const endPos = textArea.selectionEnd;

      // 获取选中的文本作为链接文本
      const selectedText = value.substring(startPos, endPos);

      // 如果有选中文本，使用它作为链接文本；否则使用URL作为文本
      const linkText = selectedText || text;
      const markdownLink = `[${linkText}](${text})`;

      // 更新内容
      const newValue = value.substring(0, startPos) +
                      markdownLink +
                      value.substring(endPos);

      onChange(newValue);

      // 设置新的光标位置
      setTimeout(() => {
        const newCursorPos = startPos + markdownLink.length;
        textArea.selectionStart = newCursorPos;
        textArea.selectionEnd = newCursorPos;
      }, 0);
    }
  };

  useEffect(() => {
    const editor = document.querySelector('.w-md-editor-text-input');
    if (editor) {
      editor.addEventListener('paste', handlePaste as EventListener);
      return () => editor.removeEventListener('paste', handlePaste as EventListener);
    }
  }, [value]);

  return (
    <div className="markdown-editor-container">
      <MDEditor
        value={value}
        onChange={(val) => onChange(val || '')}
        height={height}
        data-color-mode="light"
        preview="live"
        visibleDragbar={true}
        textareaProps={{
          style: {
            color: '#333',
            caretColor: '#333',
            WebkitTextFillColor: '#333'
          }
        }}
      />
    </div>
  );
}
