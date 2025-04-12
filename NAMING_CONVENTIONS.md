# 命名规范

为确保代码一致性和避免由命名不一致导致的问题，本项目采用以下命名规范。

## 1. 通用规则

- **所有代码**必须使用**驼峰命名法**（camelCase）
- 避免使用下划线命名法（snake_case）
- 保持命名一致性，避免混用不同的命名风格

## 2. JavaScript/TypeScript 命名规范

### 变量和函数

- 使用**小驼峰命名法**（camelCase）
  - 正确: `userName`, `fetchUserData`, `isLoading`
  - 错误: `user_name`, `fetch_user_data`, `is_loading`

### 类和组件

- 使用**大驼峰命名法**（PascalCase）
  - 正确: `UserProfile`, `PostCard`, `AdminLayout`
  - 错误: `userProfile`, `post_card`, `admin_layout`

### 常量

- 使用**大写字母和下划线**（仅此例外）
  - 正确: `MAX_RETRY_COUNT`, `API_BASE_URL`
  - 错误: `maxRetryCount`, `apiBaseUrl`（这些应该用于变量，而非常量）

## 3. 数据库相关命名

### 数据库字段

- 在 schema 定义中使用**小驼峰命名法**（camelCase）
  - 正确: `createdAt`, `updatedAt`, `userId`
  - 错误: `created_at`, `updated_at`, `user_id`

### 数据库表

- 使用**小驼峰命名法**的复数形式
  - 正确: `users`, `posts`, `postTags`
  - 错误: `user`, `post`, `post_tags`

## 4. API 相关命名

### API 路由

- 使用**小写字母和连字符**（kebab-case）
  - 正确: `/api/user-profile`, `/api/blog-posts`
  - 错误: `/api/userProfile`, `/api/blogPosts`

### API 参数

- 使用**小驼峰命名法**（camelCase）
  - 正确: `userId`, `postSlug`, `includeDeleted`
  - 错误: `user_id`, `post_slug`, `include_deleted`

## 5. 文件和目录命名

### 组件文件

- 使用**大驼峰命名法**（PascalCase）
  - 正确: `UserProfile.tsx`, `PostCard.tsx`
  - 错误: `user-profile.tsx`, `post_card.tsx`

### 非组件文件

- 使用**小驼峰命名法**（camelCase）
  - 正确: `utils.ts`, `apiClient.ts`
  - 错误: `Utils.ts`, `api-client.ts`

### 目录

- 使用**小写字母和连字符**（kebab-case）
  - 正确: `user-profiles/`, `blog-posts/`
  - 错误: `UserProfiles/`, `blogPosts/`

## 6. CSS/SCSS 命名

### 类名

- 使用**小写字母和连字符**（kebab-case）
  - 正确: `.user-profile`, `.post-card`
  - 错误: `.userProfile`, `.post_card`

## 7. 特别注意事项

- **数据库字段与代码字段保持一致**：确保数据库中的字段名与代码中使用的字段名完全一致，避免因命名不一致导致的错误
- **避免混用命名风格**：在同一个文件或组件中，保持命名风格的一致性
- **遵循框架约定**：如果使用的框架有特定的命名约定，优先遵循框架的约定

## 8. 重构指南

当发现不符合命名规范的代码时：

1. 创建专门的重构分支
2. 系统性地更新命名
3. 确保所有相关引用都已更新
4. 全面测试功能
5. 提交代码审查

遵循这些命名规范将有助于提高代码可读性、减少错误，并使团队协作更加顺畅。
