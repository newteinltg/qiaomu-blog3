# 向阳乔木的个人博客 - 数据库结构说明

本文档详细说明了个人博客系统的数据库结构，包括所有表、字段及其关系。

## 数据库概览

数据库使用 SQLite 实现，包含以下表：

1. `users` - 用户信息
2. `categories` - 文章分类
3. `posts` - 博客文章
4. `tags` - 文章标签
5. `post_tags` - 文章和标签的多对多关系
6. `post_categories` - 文章和分类的多对多关系
7. `menus` - 网站导航菜单
8. `media` - 媒体文件（图片等）

## 表结构详情

### 1. users（用户表）

存储博客系统用户信息，主要用于管理员登录和文章作者标识。

| 字段名 | 类型 | 约束 | 描述 |
|-------|------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 用户ID，自增主键 |
| email | TEXT | UNIQUE NOT NULL | 用户邮箱，唯一标识 |
| password | TEXT | NOT NULL | 用户密码（加密存储） |
| createdAt | TEXT | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

### 2. categories（分类表）

存储博客文章的分类信息，支持层级分类结构。

| 字段名 | 类型 | 约束 | 描述 |
|-------|------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 分类ID，自增主键 |
| name | TEXT | UNIQUE NOT NULL | 分类名称，唯一 |
| slug | TEXT | UNIQUE NOT NULL | 分类别名，用于URL |
| description | TEXT | | 分类描述 |
| parent_id | INTEGER | REFERENCES categories(id) | 父分类ID，自引用外键 |
| order | INTEGER | NOT NULL DEFAULT 0 | 分类排序 |
| created_at | TEXT | DEFAULT CURRENT_TIMESTAMP NOT NULL | 创建时间 |
| updated_at | TEXT | | 更新时间 |

### 3. posts（文章表）

存储博客文章的主要内容。

| 字段名 | 类型 | 约束 | 描述 |
|-------|------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 文章ID，自增主键 |
| title | TEXT | NOT NULL | 文章标题 |
| slug | TEXT | UNIQUE NOT NULL | 文章别名，用于URL |
| content | TEXT | NOT NULL | 文章内容 |
| excerpt | TEXT | | 文章摘要 |
| published | INTEGER | DEFAULT 0 | 发布状态（0:草稿，1:已发布） |
| pinned | INTEGER | DEFAULT 0 | 置顶状态（0:普通，1:置顶） |
| coverImage | TEXT | | 封面图片URL |
| createdAt | TEXT | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updatedAt | TEXT | DEFAULT CURRENT_TIMESTAMP | 更新时间 |
| authorId | INTEGER | REFERENCES users(id) | 作者ID，外键关联users表 |
| categoryId | INTEGER | REFERENCES categories(id) | 主分类ID，外键关联categories表 |

### 4. tags（标签表）

存储文章标签信息。

| 字段名 | 类型 | 约束 | 描述 |
|-------|------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 标签ID，自增主键 |
| name | TEXT | NOT NULL | 标签名称 |
| slug | TEXT | NOT NULL | 标签别名，用于URL |
| description | TEXT | | 标签描述 |
| created_at | TEXT | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

### 5. post_tags（文章标签关联表）

存储文章和标签之间的多对多关系。

| 字段名 | 类型 | 约束 | 描述 |
|-------|------|------|------|
| post_id | INTEGER | REFERENCES posts(id) ON DELETE CASCADE | 文章ID，外键关联posts表 |
| tag_id | INTEGER | REFERENCES tags(id) ON DELETE CASCADE | 标签ID，外键关联tags表 |
| | | PRIMARY KEY (post_id, tag_id) | 联合主键 |

### 6. post_categories（文章分类关联表）

存储文章和分类之间的多对多关系（除主分类外的其他分类）。

| 字段名 | 类型 | 约束 | 描述 |
|-------|------|------|------|
| postId | INTEGER | REFERENCES posts(id) | 文章ID，外键关联posts表 |
| categoryId | INTEGER | REFERENCES categories(id) | 分类ID，外键关联categories表 |
| | | PRIMARY KEY (postId, categoryId) | 联合主键 |

### 7. menus（菜单表）

存储网站导航菜单信息，支持多级菜单结构。

| 字段名 | 类型 | 约束 | 描述 |
|-------|------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 菜单ID，自增主键 |
| name | TEXT | NOT NULL | 菜单名称 |
| description | TEXT | | 菜单描述 |
| url | TEXT | | 链接URL |
| is_external | INTEGER | DEFAULT 0 NOT NULL | 是否外部链接（0:内部，1:外部） |
| parent_id | INTEGER | | 父菜单ID，自引用外键 |
| sort_order | INTEGER | DEFAULT 0 NOT NULL | 菜单排序 |
| is_active | INTEGER | DEFAULT 1 NOT NULL | 是否激活（0:禁用，1:启用） |
| created_at | TEXT | DEFAULT CURRENT_TIMESTAMP NOT NULL | 创建时间 |
| updated_at | TEXT | | 更新时间 |

### 8. media（媒体表）

存储上传的媒体文件信息。

| 字段名 | 类型 | 约束 | 描述 |
|-------|------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 媒体ID，自增主键 |
| url | TEXT | NOT NULL | 媒体文件URL |
| altText | TEXT | | 替代文本 |
| width | INTEGER | | 宽度（像素） |
| height | INTEGER | | 高度（像素） |
| createdAt | TEXT | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

## 数据库关系图

```
users ────┐
          │
          ▼
categories ◄───┐
    ▲          │
    │          │
    └──────┐   │
           │   │
           ▼   │
posts ────►post_categories
  │
  │
  ├────►post_tags◄───tags
  │
  │
  └────►media
  
menus
  ▲
  │
  └───
```

## 主要关系说明

1. 一篇文章(`posts`)属于一个主分类(`categories`)，通过`categoryId`字段关联
2. 一篇文章可以有多个标签(`tags`)，通过`post_tags`关联表实现多对多关系
3. 一篇文章可以属于多个附加分类，通过`post_categories`关联表实现多对多关系
4. 分类(`categories`)和菜单(`menus`)都支持自引用关系，实现层级结构
5. 文章(`posts`)属于一个作者(`users`)，通过`authorId`字段关联

## 数据完整性约束

1. 使用外键约束确保数据完整性
2. 文章和标签的关联表使用级联删除，当删除文章或标签时自动删除关联记录
3. 重要字段使用NOT NULL约束确保数据有效性
4. 唯一性约束应用于用户邮箱、分类名称/别名、文章别名等字段

---

*文档生成日期: 2025-04-05*
*作者: 向阳乔木*
