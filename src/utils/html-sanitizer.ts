/**
 * 清理HTML内容
 * 
 * 这个函数处理各种格式的HTML内容，包括：
 * 1. Markdown代码块
 * 2. 带前导说明文字的HTML片段
 * 3. 完整的HTML文档
 * 4. 非HTML内容
 * 
 * @param content 需要清理的HTML内容
 * @returns 清理后的HTML内容
 */
export function sanitizeHtml(content: string): string {
  if (!content) return '';
  
  // 移除可能的Markdown代码块标记
  let cleanedContent = content;
  
  // 处理Markdown代码块格式 ```html ... ```
  const markdownHtmlPattern = /```html\s*([\s\S]*?)\s*```/;
  const markdownMatch = content.match(markdownHtmlPattern);
  if (markdownMatch && markdownMatch[1]) {
    cleanedContent = markdownMatch[1];
  }
  
  // 处理可能的前导说明文字，寻找第一个HTML标签
  const htmlStartPattern = /<(!DOCTYPE|html|head|body|div|p|span|a|img|script|link|meta)/i;
  const htmlStartMatch = cleanedContent.match(htmlStartPattern);
  if (htmlStartMatch) {
    const startIndex = htmlStartMatch.index;
    if (startIndex && startIndex > 0) {
      cleanedContent = cleanedContent.substring(startIndex);
    }
  }
  
  // 确保内容是有效的HTML
  if (!cleanedContent.trim().startsWith('<')) {
    // 如果不是以HTML标签开头，包装为HTML
    cleanedContent = `<div>${cleanedContent}</div>`;
  }
  
  return cleanedContent;
}
