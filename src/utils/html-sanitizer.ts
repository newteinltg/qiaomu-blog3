/**
 * 清理HTML内容，移除Markdown代码块标记和说明文字，确保返回有效的HTML
 * @param content 可能包含Markdown标记或说明文字的HTML内容
 * @returns 清理后的纯HTML内容
 */
export function sanitizeHtml(content: string): string {
  if (!content) return '';
  
  let cleanedContent = content.trim();
  
  // 1. 处理Markdown代码块
  const markdownRegex = /```(?:html)?\s*([\s\S]*?)\s*```/;
  const markdownMatch = cleanedContent.match(markdownRegex);
  if (markdownMatch) {
    cleanedContent = markdownMatch[1].trim();
  }
  
  // 2. 处理可能的前导说明文字
  // 策略：如果内容以非HTML字符开头，查找第一个HTML标签并从那里开始
  if (!/^\s*</.test(cleanedContent)) {
    const firstTagMatch = cleanedContent.match(/<[a-z][^>]*>/i);
    if (firstTagMatch) {
      const firstTagIndex = cleanedContent.indexOf(firstTagMatch[0]);
      if (firstTagIndex > 0) {
        cleanedContent = cleanedContent.substring(firstTagIndex);
      }
    }
  }
  
  // 3. 检查是否已经是完整的HTML文档
  const hasDoctype = /<!DOCTYPE\s+html[^>]*>/i.test(cleanedContent);
  const hasHtmlTag = /<html[^>]*>/i.test(cleanedContent);
  
  if (hasDoctype || hasHtmlTag) {
    // 已经是完整的HTML文档或接近完整，不需要额外处理
    return cleanedContent;
  }
  
  // 4. 检查是否包含HTML标签
  const hasHtmlTags = /<[a-z][^>]*>[\s\S]*?<\/[a-z][^>]*>/i.test(cleanedContent);
  
  if (hasHtmlTags || /<[a-z][^>]*>/i.test(cleanedContent)) {
    // 包含HTML标签，但不是完整文档，将其视为HTML片段
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HTML Content</title>
</head>
<body>
  ${cleanedContent}
</body>
</html>`;
  }
  
  // 5. 内容不像HTML，原样返回
  return cleanedContent;
}
