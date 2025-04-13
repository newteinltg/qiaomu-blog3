# 向阳乔木个人博客系统

这是一个基于 [Next.js](https://nextjs.org) 构建的个人博客系统，支持文章管理、分类管理、标签管理等功能。系统采用现代化的设计风格，响应式布局，支持深色模式，提供良好的用户体验。

## 技术栈

- **前端框架**: Next.js 14 (App Router)
- **编程语言**: TypeScript
- **样式处理**: Tailwind CSS
- **数据库**: SQLite
- **ORM**: Drizzle ORM
- **认证**: NextAuth.js
- **内容管理**: Markdown 支持、HTML 全页面支持
- **部署**: Vercel

## 功能特性

### 前台功能

#### 首页设计

- **英雄区域**: 展示博客标题和简介，可通过后台配置
- **推荐文章轮播**: 展示置顶文章，支持自动轮播
- **最新文章列表**: 按发布时间展示最新文章
- **侧边栏**: 展示分类、标签云、公众号信息，只显示有已发布文章的分类和标签

#### 文章详情页

- **Markdown 渲染**: 支持 Markdown 格式的文章内容
- **HTML 全页面**: 支持创建完整的 HTML 页面，不使用网站模板
- **浮动信息栏**: 在 HTML 全页面模式下提供导航功能
- **相关文章推荐**: 展示相关文章
- **文章元信息**: 展示发布时间、分类、标签等信息

#### 分类和标签页面

- **分类文章列表**: 展示特定分类下的所有文章
- **标签文章列表**: 展示与特定标签关联的所有文章
- **分页支持**: 支持文章列表分页功能

#### 导航和页脚

- **响应式导航菜单**: 支持移动端和桌面端的导航体验，支持三级菜单结构
- **自定义页脚**: 展示联系方式、打赏信息和推荐链接

#### HTML全页面功能

- **完整HTML支持**: 可以创建完整的HTML页面，包含CSS和JavaScript
- **JavaScript执行**: 使用iframe加载HTML内容，确保JavaScript代码完整执行
- **无内容过滤**: 直接渲染原始 HTML 内容，不进行任何风险过滤
- **页面类型选择**: 在文章编辑器中可选择Markdown或HTML全页面模式
- **半透明信息栏**: 底部显示75%透明度的信息栏，包含文章标题、分类、标签和导航按钮
- **可关闭设计**: 信息栏可以关闭，刷新页面后重新显示
- **数据库集成**: 仍然使用数据库管理文章元数据，如分类、标签等

### 后台功能

#### 文章管理

- **文章创建与编辑**: 支持 Markdown 编辑器和 HTML 全页面模式
- **草稿与发布**: 支持文章草稿和发布状态
- **文章置顶**: 支持设置文章置顶显示
- **多分类支持**: 一篇文章可关联多个分类

#### 分类和标签管理

- **分类管理**: 创建、编辑和删除分类
- **标签管理**: 创建、编辑和删除标签
- **智能显示**: 侧边栏只显示有已发布文章的分类和标签，并且文章计数只计算已发布的文章

#### 系统设置

- **网站信息设置**: 配置网站名称、英雄区域文本等
- **联系方式设置**: 配置公众号、联系方式等信息
- **推荐链接设置**: 配置页脚推荐链接

## 最近实现的功能

### HTML全网页模式管理员编辑功能

- **问题**: 需要支持完整HTML页面的编辑和创建，包括CSS和JavaScript
- **解决方案**: 
  - 添加页面类型选择器，支持Markdown和HTML全页面两种模式
  - 为HTML全页面模式创建专用编辑器，支持完整HTML代码编辑
  - 使用iframe加载HTML内容，确保JavaScript代码正常执行

### 修复HTML全网页发布系统

- **问题修复**: 解决了在编辑文章时选择HTML页面类型但设置未能成功保存的问题
- **原因分析**: PUT API处理程序中缺少对`pageType`字段的处理，导致HTML模式设置未能保存到数据库
- **技术实现**:
  - 修复了`src/app/api/posts/[id]/route.ts`中的PUT处理程序，添加了`pageType`字段的解构和处理
  - 更新了事务处理逻辑，确保`pageType`字段被正确保存
  - 完善了日志记录，便于调试和问题追踪

### 所有文章页面

- **所有文章列表**: 创建了 `/posts` 路径的页面，展示所有已发布的文章
- **分类、标签筛选**: 支持按分类和标签筛选文章
- **搜索过滤**: 支持按关键词搜索文章
- **分页支持**: 支持分页功能，每页显示25篇文章
- **一致的布局**: 页面布局与分类列表页面保持一致

### 改进搜索和筛选体验

- **用户友好的无结果提示**: 修改搜索页面和所有文章页面的"无结果"提示
- **重置筛选按钮**: 将"返回首页"按钮改为"重置筛选条件"按钮
- **保持当前页面**: 点击重置按钮时，清除所有筛选条件但保持在当前页面
- **更好的用户体验**: 让用户可以轻松重置筛选条件并继续浏览

### 标签页面功能

- **标签文章列表**: 为每个标签创建专门的页面，显示与该标签关联的所有文章
- **分页支持**: 标签页面支持分页功能，每页显示固定数量的文章
- **文章计数**: 正确显示每个标签下的文章总数
- **响应式设计**: 标签页面在不同设备上都能良好显示
- **SEO优化**: 为每个标签页面生成适当的标题和元数据

### 技术实现

- **API优化**:
  - 创建了专门的API端点 `/api/tags/[slug]/posts` 获取标签相关文章
  - 使用 SQL 连接查询确保只返回与特定标签关联的文章
  - 实现了正确的文章计数和分页功能
- **错误处理**:
  - 添加了完善的错误处理机制，确保在数据库查询失败时返回友好的错误信息
  - 客户端组件中实现了加载状态和错误状态的显示
- **数据过滤**:
  - 只显示已发布的文章，草稿不会出现在标签页面中
  - 使用 `innerJoin` 确保只返回与标签关联的文章

### 多分类支持

- **文章多分类关联**: 一篇文章可以同时属于多个分类，提高了内容组织的灵活性
- **分类计数优化**: 侧边栏中的分类现在会正确显示每个分类下的文章数量
- **创建/编辑界面改进**:
  - 文章创建和编辑界面支持多选分类
  - 使用复选框代替下拉菜单，提供更直观的多选体验
  - 保持创建和编辑界面的一致性

### 多分类技术实现

- **数据库关联表**: 使用 `post_categories` 关联表存储文章与分类的多对多关系
- **事务处理**: 使用数据库事务确保文章与分类关联的原子性操作
- **API优化**:
  - 创建了专门的API端点管理文章与分类的关联
  - 修改了分类查询代码，使用关联表统计文章数量

## 使用说明

### 标签页面使用指南

#### 访问标签页面

标签页面可以通过以下方式访问：

1. 从侧边栏的标签云中点击标签名称
2. 从文章详情页面中点击文章底部的标签
3. 直接访问 URL：`/tags/[slug]`，其中 `[slug]` 是标签的别名

#### 注意事项

- 标签页面只显示已发布的文章，草稿状态的文章不会出现
- 每个标签页面默认显示 10 篇文章，可以通过分页器查看更多
- 标签页面的 URL 使用标签的 slug（别名），而非标签 ID 或名称

#### 开发者注意事项

- 标签页面使用客户端组件实现，佽配 API 进行数据获取
- API 路径为 `/api/tags/[slug]/posts`，支持 `page` 和 `pageSize` 查询参数
- 标签与文章的关联存储在 `post_tags` 表中，使用多对多关系

## 开始使用

### 本地部署

```bash
# 克隆仓库
git clone https://github.com/joeseesun/qiaomu-blog3.git
cd qiaomu-blog3

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

在浏览器中打开 [http://localhost:3000](http://localhost:3000) 查看结果。

## 最近实现的功能

#### Markdown编辑器粘贴图片功能修复

- **问题修复**: 修复了后台Markdown编辑器中粘贴截图无法插入的问题
- **错误处理增强**: 添加了全面的错误处理机制，捕获并显示更详细的错误信息
- **超时控制**: 添加了请求超时控制，防止上传请求长时间无响应
- **上传状态指示器**: 添加了可视化的上传状态指示器，提供更好的用户反馈
- **响应验证**: 增强了服务器响应的验证，确保返回的数据格式正确
- **技术实现**: 使用AbortController实现请求超时控制，使用try-catch块实现全面的错误处理

#### 管理员快捷操作功能

- **文章详情页编辑链接**: 在文章详情页的更新时间旁边添加"编辑"链接，方便管理员快速编辑文章
- **导航栏发布按钮**: 在网站导航栏添加发布文章图标，点击直接跳转到后台发布页面
- **权限控制**: 编辑链接和发布按钮只对已登录的管理员可见，普通访客看不到这些元素
- **响应式设计**: 在移动端和桌面端都提供了适合的快捷操作按钮
- **一致的样式**: 快捷操作按钮使用与网站风格一致的设计，确保视觉体验的一致性
- **技术实现**: 使用客户端组件和NextAuth的useSession钩子检测用户登录状态，实现条件渲染

#### 主题切换功能改进

- **改进的主题切换机制**: 使用 React 状态管理替代脚本实现，解决水合不匹配问题
- **桌面端图标化**: 桌面端主题切换按钮只显示太阳/月亮图标，不显示文字
- **移动端图文结合**: 移动端主题切换按钮显示图标和“切换主题”文字
- **后台管理界面保持浅色**: 后台管理界面始终使用浅色主题，不受主题切换影响
- **技术实现**: 使用 ThemeProvider 组件管理主题状态，确保在所有页面上的一致性

#### NextAuth.js认证优化

- **环境变量配置**: 更新NEXTAUTH_SECRET环境变量，增强安全性
- **SessionProvider统一化**: 统一使用自定义SessionProvider组件，解决多处导入不一致问题
- **登录页面优化**: 修复登录页面的SessionProvider导入，确保使用正确的组件
- **错误处理改进**: 增强客户端认证错误处理，提供更好的用户体验

#### HTML文章类型编辑优化

- **条件渲染编辑器**: 根据页面类型显示不同的编辑器，Markdown或HTML
- **HTML编辑器实现**: 为HTML全页面模式添加专用的文本编辑器，支持直接编辑HTML代码
- **统一Checkbox样式**: 在新建和编辑页面中统一使用UI组件库的Checkbox组件
- **封面图粘贴优化**: 改进封面图粘贴功能，允许在整个页面上粘贴图片
- **编辑器一致性**: 确保新建和编辑页面的编辑器体验一致

#### 三级菜单支持

- **多级导航结构**: 实现了支持三级菜单的导航组件
- **桌面端悬浮菜单**: 在桌面端使用悬浮式三级菜单，提供直观的层级导航
- **移动端折叠菜单**: 在移动端使用折叠式三级菜单，适应小屏幕设备
- **样式定制**: 使用独立的 CSS 文件管理导航样式，方便维护和扩展

#### 移动端菜单优化

- **React状态管理**: 重构移动端菜单，使用React状态管理替代DOM操作
- **改进的用户体验**: 添加平滑过渡效果和图标旋转动画
- **调试工具**: 添加开发环境调试信息显示，方便排查问题
- **可访问性改进**: 添加ARIA属性，提高菜单的可访问性

#### Markdown编辑器优化

- **兼容性改进**: 优化 @uiw/react-md-editor 的兼容性，解决与 React 19 的兼容问题
- **样式隔离组件**: 创建独立的编辑器组件，使用隔离的样式解决文本颜色问题
- **动态样式注入**: 在运行时动态注入编辑器样式，避免全局样式冲突
- **全屏模式修复**: 修复编辑器全屏按钮不生效的问题，增强用户体验
- **错误处理**: 添加错误处理和加载状态显示，提高用户体验
- **图片上传支持**: 保留原有的图片粘贴上传功能，提供方便的内容编辑体验

#### 分类页面功能

- **分类文章列表**: 为每个分类创建专门的页面，显示该分类下的所有文章
- **分页支持**: 分类页面支持分页功能，每页显示固定数量的文章
- **分类描述**: 显示分类的名称和描述信息

#### 文章详情页功能

- **Markdown 渲染**: 支持 Markdown 格式的文章内容渲染
- **HTML 全页面**: 支持创建完整的 HTML 页面，不使用网站模板
- **浮动信息栏**: 在 HTML 全页面模式下显示可隐藏的导航信息栏
- **相关文章**: 在文章底部显示相关文章推荐
- **文章元信息**: 显示文章的发布时间、分类、标签等信息

#### 统一的文章列表样式

- **一致的卡片设计**: 在首页、标签页和分类页使用一致的文章卡片设计
- **分类信息显示**: 在文章卡片中显示分类信息
- **标签信息显示**: 在文章卡片中显示文章的标签
- **无摘要设计**: 移除文章卡片中的摘要显示，使布局更加简洁、一致
- **无作者信息**: 移除文章卡片中的作者信息显示

#### 系统设置功能

- **网站信息设置**: 支持配置网站名称、英雄区域文本等
- **联系方式设置**: 支持配置公众号、联系方式等信息
- **推荐链接设置**: 支持配置页脚推荐链接

## 开发经验与最佳实践

### 前端开发

#### 响应式设计

- **使用 Tailwind CSS**: 采用 Tailwind CSS 实现响应式设计，确保在不同设备上的良好体验
- **移动优先**: 采用移动优先的设计理念，确保在移动设备上的良好体验
- **深色模式支持**: 实现深色模式支持，提供更好的阅读体验

#### 组件设计

- **组件复用**: 创建可复用的组件，如文章卡片、分页器等
- **布局一致性**: 保持不同页面间的布局一致性，提高用户体验
- **空间使用**: 合理使用空间，确保内容布局清晰、易读
- **布局间距优化**: 精心调整各页面元素间的间距，使布局更加协调、美观

### 后端开发

#### API 设计

- **RESTful API**: 采用 RESTful 风格的 API 设计
- **错误处理**: 实现完善的错误处理机制
- **数据过滤**: 在 API 中实现数据过滤，只返回必要的数据

#### 数据库设计

- **多对多关系**: 使用关联表实现文章与分类、文章与标签的多对多关系
- **数据完整性**: 确保数据库的完整性和一致性
- **默认值处理**: 对缺失的封面图等实现默认值处理，提高用户体验

### 遇到的问题与解决方案

#### 分类页面和侧边栏显示问题

- **问题**: 侧边栏显示有文章的分类，但点击后分类页面不显示文章
- **原因分析**: 多重因素导致该问题：
  1. 查询逻辑问题：分类页面的 API 使用了不正确的表连接顺序
  2. 缓存问题：分类页面的客户端组件使用了缓存，导致即使后端 API 返回了正确的数据，前端也可能显示旧的缓存数据
- **解决方案**:
  1. 修改 API 查询逻辑：
     - 将查询起点从 `posts` 表改为 `postCategories` 表
     - 使用 `innerJoin` 而非 `leftJoin` 确保只返回有关联的数据
     - 添加 `where` 条件过滤出已发布的文章
  2. 禁用客户端缓存：
     - 在客户端组件中禁用缓存机制
     - 在 API 请求中添加时间戳参数，确保每次请求都是唯一的
     - 添加缓存控制头，禁用浏览器缓存
  3. 添加调试信息：
     - 添加 `console.log` 语句，跟踪数据流和问题所在

#### Next.js 15.2.4静态资源访问问题

- **问题**: 在Next.js 15.2.4版本中，上传的图片（如文章封面图）无法正确显示，特别是在生产环境中
- **原因**: 
  1. 中间件配置问题：默认的中间件配置会拦截静态资源请求，导致需要登录才能访问上传的图片
  2. 路由处理器类型变更：Next.js 15.2.4中路由处理器的参数类型从`{ params: { path: string[] } }`变更为`{ params: Promise<{ path: string[] }> }`
  3. 配置选项变更：一些实验性配置选项被移除或重命名，如`serverComponentsExternalPackages`移至`serverExternalPackages`
- **解决方案**:
  - 修改中间件配置，确保`/uploads`路径不被拦截：`matcher: ['/((?!api|_next/static|_next/image|favicon.ico|uploads/.*|.*\\.png$).*)']`
  - 创建专用的静态资源处理路由`/src/app/uploads/[...path]/route.ts`，处理上传文件的访问
  - 更新Next.js配置，使用最新的配置选项：`serverExternalPackages: ['sharp']`
  - 在图片组件中添加错误处理，自动尝试修复相对路径问题

#### 标签页面和侧边栏显示问题

- **问题**: 标签页面和侧边栏只显示有文章的标签，但计数不准确
- **原因分析**: 标签计数逻辑没有正确过滤已发布的文章，导致草稿也被计入
- **解决方案**: 
  - 修改标签查询逻辑，只计算已发布的文章
  - 优化侧边栏组件，确保只显示有已发布文章的标签
  - 添加缓存机制，提高加载速度

#### 主题切换功能问题

- **问题**: 浅色和深色主题切换在某些页面上出现问题，导致水合不匹配错误
- **原因**: 多个因素导致该问题：
  1. 脚本加载时机问题：主题切换脚本在 DOM 加载后执行，可能在 React 水合完成前就开始修改 DOM
  2. 主题初始化时机问题：在 React 水合过程中，DOM 可能被重新渲染，导致主题状态丢失
  3. 页面结构差异：不同页面使用不同的布局结构，导致主题切换按钮的选择器在不同页面上工作方式不一致
- **解决方案**:
  - 创建 ThemeProvider 组件，使用 React 的 Context API 管理主题状态
  - 使用 useEffect 钩子确保主题初始化在客户端渲染时执行
  - 移除 theme.js 脚本，将所有主题相关逻辑移到 ThemeProvider 组件中
  - 添加后台管理界面检测，确保后台始终使用浅色主题

#### HTML文章类型编辑问题

- **问题**: HTML文章类型的编辑和创建功能与 Markdown 文章编辑实现不一致，包括提交按钮、Checkbox 样式和封面图粘贴功能
- **原因**: 编辑器没有根据页面类型条件渲染不同的编辑器，新建页面使用原生 HTML 的 Checkbox，而编辑页面使用 UI 组件库的 Checkbox
- **解决方案**:
  - 添加条件渲染逻辑，根据 pageType 的值显示不同的编辑器
  - 统一使用 UI 组件库的 Checkbox 和 Label 组件
  - 优化封面图粘贴功能，允许在整个页面上粘贴图片

#### 特殊内容展示

- **问题**: 需要展示完整的HTML页面，不使用网站模板，同时保留导航功能，并确保JavaScript代码正常执行
- **解决方案**: 添加HTML全页面模式，使用iframe加载HTML内容，并实现半透明的浮动信息栏，显示文章元数据和导航按钮

#### 布局一致性

- **问题**: 不同页面的文章列表样式不一致，首页、标签页和分类页的文章卡片展示信息不同
- **解决方案**: 统一所有页面的文章卡片设计，移除摘要和作者信息，添加分类信息显示

#### 元素间距

- **问题**: 页面元素间的间距不一致，导致视觉体验不佳
- **解决方案**: 精心调整各页面元素间的间距，使用一致的间距类，如 `mt-4`，使布局更加协调

#### 轮播图与侧边栏顶部对齐问题

- **问题**: 首页轮播图与右侧侧边栏顶部没有对齐，轮播图顶部有额外的空白区域
- **原因分析**: 在 `globals.css` 文件中，`.featured-slider` 类使用了 `my-8` 类，这会在轮播图的顶部和底部添加 2rem 的 margin
- **解决方案**:
  - 将 `.featured-slider` 类的 `my-8` 修改为 `mb-8`，只保留底部 margin，移除顶部 margin
  - 修复了 FeaturedSlider 组件的结构和缩进问题，确保没有额外的嵌套 div 导致不必要的空间
  - 这样轮播图和侧边栏的第一个模块（分类）能够在顶部对齐，提供更好的视觉效果

#### 页面加载速度

- **问题**: 分类列表和标签列表页面加载速度较慢
- **解决方案**: 实现了多项性能优化措施，包括数据库查询优化、客户端缓存和代码优化

### 性能优化经验

#### 数据库查询优化

- **减少查询次数**: 将多次单独的查询合并为批量查询，使用 `IN` 操作符一次性获取多篇文章的标签和分类信息
- **使用数据结构优化**: 使用 Map 数据结构高效组织查询结果，减少内存占用和处理时间
- **避免循环查询**: 避免在 Promise.all 和 map 中进行单独的数据库查询

#### 客户端缓存实现

- **内存缓存**: 在客户端组件中实现内存缓存机制，使用 `cacheKey` 基于标签/分类和页码缓存查询结果
- **HTTP 缓存控制**: 在 fetch 请求中添加 `cache: 'force-cache'` 选项，利用浏览器和 Next.js 的缓存机制

#### 代码优化

- **减少日志输出**: 移除不必要的控制台日志，减少浏览器资源占用
- **简化逻辑**: 移除冗余代码，优化条件判断和数据处理逻辑

#### HTML全页面JavaScript执行

- **问题**: HTML全页面模式下，JavaScript代码不能正常执行
- **原因**: 使用innerHTML注入HTML内容时，浏览器出于安全考虑不会执行其中的JavaScript代码
- **解决方案**: 使用iframe加载HTML内容，并设置适当的sandbox属性允许脚本执行

#### 效果

- **显著提升加载速度**: 分类和标签页面加载速度显著提升
- **改善用户体验**: 用户在浏览同一页面或返回之前访问过的页面时，可以立即看到内容
- **减轻服务器负担**: 减少数据库查询次数，降低服务器负载

## 部署与开发

详细的部署指南请参考 [DEPLOY.md](DEPLOY.md) 文件，其中包含了完整的部署步骤、配置说明和常见问题解决方案。

## 项目结构

```
personal-blog/
├── public/            # 静态资源
├── src/
│   ├── app/           # Next.js App Router 目录
│   │   ├── admin/     # 后台管理页面
│   │   ├── api/       # API 路由
│   │   ├── categories/ # 分类页面
│   │   ├── posts/     # 文章页面
│   │   ├── tags/      # 标签页面
│   │   └── page.tsx   # 首页
│   ├── components/    # 可复用组件
│   ├── lib/           # 工具函数和数据库配置
│   └── styles/        # 全局样式
├── .env              # 环境变量
├── package.json      # 项目依赖
└── README.md         # 项目文档
```

## 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

#### 元素间距

- **问题**: 页面元素间的间距不一致，导致视觉体验不佳
- **解决方案**: 精心调整各页面元素间的间距，使用一致的间距类，如 `mt-4`，使布局更加协调

#### Next.js 15.2.4静态资源访问问题

- **问题**: 在Next.js 15.2.4版本中，上传的图片（如文章封面图）无法正确显示，特别是在生产环境中
- **原因**: 
  1. 中间件配置问题：默认的中间件配置会拦截静态资源请求，导致需要登录才能访问上传的图片
  2. 路由处理器类型变更：Next.js 15.2.4中路由处理器的参数类型从`{ params: { path: string[] } }`变更为`{ params: Promise<{ path: string[] }> }`
  3. 配置选项变更：一些实验性配置选项被移除或重命名，如`serverComponentsExternalPackages`移至`serverExternalPackages`
- **解决方案**:
  - 修改中间件配置，确保`/uploads`路径不被拦截：`matcher: ['/((?!api|_next/static|_next/image|favicon.ico|uploads/.*|.*\\.png$).*)']`
  - 创建专用的静态资源处理路由`/src/app/uploads/[...path]/route.ts`，处理上传文件的访问
  - 更新Next.js配置，使用最新的配置选项：`serverExternalPackages: ['sharp']`
  - 在图片组件中添加错误处理，自动尝试修复相对路径问题

#### 轮播图与侧边栏顶部对齐问题

- **问题**: 首页轮播图与右侧侧边栏顶部没有对齐，轮播图顶部有额外的空白区域
- **原因分析**: 在 `globals.css` 文件中，`.featured-slider` 类使用了 `my-8` 类，这会在轮播图的顶部和底部添加 2rem 的 margin
- **解决方案**:
  - 将 `.featured-slider` 类的 `my-8` 修改为 `mb-8`，只保留底部 margin，移除顶部 margin
  - 修复了 FeaturedSlider 组件的结构和缩进问题，确保没有额外的嵌套 div 导致不必要的空间
  - 这样轮播图和侧边栏的第一个模块（分类）能够在顶部对齐，提供更好的视觉效果

## 最近实现的功能

### 修复文章编辑页面标签显示问题

- **问题**: 编辑文章时，已有的标签无法正确显示在标签输入框中
- **原因分析**: 
  1. SQL IN 子句格式问题：标签 API 中的 SQL 查询使用了不正确的 IN 子句格式
  2. 数据格式问题：返回的标签数据格式与 TagifyInput 组件期望的格式不匹配
  3. 缓存问题：API 请求可能受到浏览器缓存的影响，导致无法获取最新数据

- **解决方案**:
  1. 修复 SQL 查询：使用正确的 SQL 语法构建 IN 子句，确保能够正确查询多个标签
  2. 数据格式化：正确格式化标签数据为 TagifyInput 组件所需的 JSON 格式
  3. 缓存控制：添加缓存控制头，确保每次请求都获取最新数据
  4. 错误处理增强：添加详细的日志输出和错误处理，便于调试和问题排查

- **技术实现**:
  ```typescript
  // 使用直接的 SQL 查询替代复杂的 ORM 构建器
  const idList = tagIds.join(',');
  const query = `SELECT * FROM tags WHERE id IN (${idList})`;
  const result = await db.all(sql.raw(query));
  
  // 正确格式化标签数据
  const formattedTags = tagsData.map(tag => ({
    value: tag.name,
    id: tag.id
  }));
  
  // 添加缓存控制头
  const response = await fetch(`/api/posts/${postId}/tags`, {
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    }
  });
  ```

- **经验教训**:
  1. SQL IN 子句需要特别注意格式，尤其是在使用 ORM 时
  2. 组件数据格式需要严格匹配，尤其是第三方组件如 Tagify
  3. API 请求应考虑缓存问题，必要时添加缓存控制头
  4. 详细的日志输出对于调试复杂问题至关重要
  5. 在生产环境中测试修复，确保问题在实际环境中得到解决

### 移除后台缓存刷新功能

- **优化**: 移除了后台管理控制台中的缓存刷新功能
- **原因**: 
  1. 随着首页动态渲染功能的实现（使用 `fetchCache = 'force-no-store'`），缓存刷新功能已不再必要
  2. 简化用户界面，移除冗余功能，提高用户体验
  3. 减少不必要的API调用和服务器负载

- **实现细节**:
  1. 从管理控制台页面移除了"刷新缓存"按钮
  2. 移除了"重新构建站点"卡片
  3. 移除了相关的状态管理和API调用代码
  4. 保留了API端点以备将来可能需要

- **技术实现**:
  ```typescript
  // 移除了以下代码
  const [regenerating, setRegenerating] = useState(false);
  
  const handleRegenerateStaticContent = async () => {
    setRegenerating(true);
    try {
      const response = await fetch('/api/revalidate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path: '/' }),
      });
      // ...处理响应...
    } catch (error) {
      // ...错误处理...
    } finally {
      setRegenerating(false);
    }
  };
  ```

- **优势**:
  1. 简化了用户界面，减少了不必要的功能干扰
  2. 减少了API调用和服务器负载
  3. 与动态渲染策略保持一致，避免混淆用户
