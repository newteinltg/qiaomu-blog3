# HTML内容渲染实现记录

## 问题背景

在博客系统中，需要渲染HTML内容页面，同时添加一个可开关的底部浮动条，但不能影响原始HTML内容的显示和JavaScript的执行。

## 解决方案

通过API路由直接提供原始HTML内容，完全避免Next.js框架对HTML的处理，同时在HTML中注入JavaScript代码来创建可开关的浮动条。

### 核心实现

1. **iframe直接加载API提供的HTML内容**
   - 修改了页面渲染方式，使用iframe直接加载API路由提供的HTML内容
   - 完全绕过Next.js的渲染流程，避免添加任何框架代码

2. **API路由处理**
   - 创建了`/api/html-content`路由，直接提供原始HTML内容
   - 使用`sanitizeHtml`函数处理HTML内容，确保内容格式正确
   - 在HTML中注入JavaScript代码，创建浮动条
   - 设置正确的`Content-Type`头，确保浏览器正确解析HTML

3. **移动友好的浮动条**
   - 关闭按钮集成在浮动条内部，不再单独悬浮
   - 关闭后完全隐藏，不显示任何UI元素
   - 双击页面可以重新显示浮动条
   - 浮动条布局优化，适应移动设备屏幕

### 技术细节

1. **HTML内容处理**
   - 使用`sanitizeHtml`函数处理各种格式的HTML内容
   - 支持Markdown代码块、带前导说明文字的HTML片段、完整HTML文档等

2. **浮动条实现**
   - 使用JavaScript动态创建DOM元素
   - 添加事件监听器处理显示/隐藏
   - 使用localStorage保存用户偏好

3. **移动适配**
   - 针对不同屏幕尺寸优化布局
   - 增加触摸区域大小
   - 适配底部安全区域

## 文件修改

1. **src/app/posts/[slug]/page.tsx**
   - 修改HTML页面类型的渲染方式，使用iframe直接加载API提供的内容

2. **src/app/api/html-content/route.ts**
   - 新增API路由，处理HTML内容并注入浮动条代码

3. **src/utils/html-sanitizer.ts**
   - 实现HTML内容清理功能，处理各种格式的HTML输入

4. **src/components/HtmlPageLayout.tsx**
   - 移除原有的渲染逻辑，改为使用API路由

## 总结

这个实现方案完全保留了原始HTML内容的完整性，同时提供了一个移动友好的、可完全隐藏的浮动条。通过使用API路由和iframe，避免了Next.js框架对HTML内容的处理，确保JavaScript能够正常执行。
