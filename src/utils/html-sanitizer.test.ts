import { sanitizeHtml } from './html-sanitizer';

// 测试用例1: Markdown代码块中的HTML
const test1 = `这是一个HTML示例：
\`\`\`html
<!DOCTYPE html>
<html>
<head>
  <title>Test</title>
</head>
<body>
  <h1>Hello World</h1>
</body>
</html>
\`\`\`
`;

// 测试用例2: 带有前导说明文字的HTML
const test2 = `这是一个HTML片段：
<div>
  <h1>Hello World</h1>
  <p>This is a paragraph.</p>
</div>`;

// 测试用例3: 完整的HTML文档
const test3 = `<!DOCTYPE html>
<html>
<head>
  <title>Test</title>
</head>
<body>
  <h1>Hello World</h1>
</body>
</html>`;

// 测试用例4: HTML片段
const test4 = `<div>
  <h1>Hello World</h1>
  <p>This is a paragraph.</p>
</div>`;

// 测试用例5: 非HTML内容
const test5 = `这不是HTML内容，只是普通文本。`;

// 测试用例6: 带有多行注释的HTML
const test6 = `这是带有注释的HTML：
<!-- 这是一个注释 -->
<div>
  <h1>Hello World</h1>
  <!-- 这是另一个注释 -->
  <p>This is a paragraph.</p>
</div>`;

// 测试用例7: 混合了Markdown和HTML的内容
const test7 = `# 这是一个标题

下面是一些HTML内容：

<div class="container">
  <h2>这是HTML中的标题</h2>
  <p>这是一个段落。</p>
</div>

## 这是另一个Markdown标题`;

// 测试用例8: 带有script标签的HTML
const test8 = `这是带有脚本的HTML：
<div>
  <h1>带有脚本的页面</h1>
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      console.log('页面已加载');
      document.querySelector('h1').style.color = 'red';
    });
  </script>
</div>`;

// 运行测试
console.log('===== 测试用例1: Markdown代码块中的HTML =====');
console.log(sanitizeHtml(test1));
console.log('\n');

console.log('===== 测试用例2: 带有前导说明文字的HTML =====');
console.log(sanitizeHtml(test2));
console.log('\n');

console.log('===== 测试用例3: 完整的HTML文档 =====');
console.log(sanitizeHtml(test3));
console.log('\n');

console.log('===== 测试用例4: HTML片段 =====');
console.log(sanitizeHtml(test4));
console.log('\n');

console.log('===== 测试用例5: 非HTML内容 =====');
console.log(sanitizeHtml(test5));
console.log('\n');

console.log('===== 测试用例6: 带有多行注释的HTML =====');
console.log(sanitizeHtml(test6));
console.log('\n');

console.log('===== 测试用例7: 混合了Markdown和HTML的内容 =====');
console.log(sanitizeHtml(test7));
console.log('\n');

console.log('===== 测试用例8: 带有script标签的HTML =====');
console.log(sanitizeHtml(test8));
