# Next.js Standalone 部署指南

本文档介绍如何使用 Next.js 的 `standalone` 输出选项进行部署，以及它与传统部署方式的区别。

## Standalone 模式简介

Next.js 的 `standalone` 输出选项会创建一个独立的应用程序包，包含运行应用所需的最小化文件集合。这种模式有以下优势：

- **更小的部署包**：不包含开发依赖和未使用的代码
- **更少的依赖**：减少对完整 `node_modules` 的依赖
- **更容易跨平台部署**：减少架构兼容性问题
- **保留所有动态功能**：与静态导出不同，保留了 API 路由、服务器端渲染等功能

## 部署方法

### 方法 1：使用 Standalone 模式部署

1. **构建应用**：
   ```bash
   npm run build
   ```

2. **准备 standalone 目录**：
   ```bash
   mkdir -p .next/standalone/.next/static
   cp -R .next/static .next/standalone/.next/
   ```

3. **确保上传目录存在**：
   ```bash
   mkdir -p .next/standalone/public/uploads
   cp -R public/uploads .next/standalone/public/ 2>/dev/null || :
   ```

4. **启动服务**：
   ```bash
   cd .next/standalone
   node server.js
   ```

   或使用 PM2：
   ```bash
   cd .next/standalone
   pm2 start server.js --name qiaomu-blog
   ```

### 方法 2：传统部署方式（仍然可用）

即使启用了 `output: 'standalone'` 选项，您仍然可以使用传统的部署方式：

1. **构建应用**：
   ```bash
   npm run build
   ```

2. **启动服务**：
   ```bash
   npm start
   ```

   或使用 PM2：
   ```bash
   pm2 start npm --name qiaomu-blog -- start
   ```

## 使用提供的部署脚本

本项目包含一个部署脚本 `deploy-standalone.sh`，可以自动执行 Standalone 模式的部署：

```bash
chmod +x deploy-standalone.sh
./deploy-standalone.sh
```

## 注意事项

1. **原生模块**：
   - 即使使用 Standalone 模式，原生模块（如 better-sqlite3）仍然需要在目标服务器上编译
   - 如果遇到架构兼容性问题，您可能需要在服务器上运行 `npm install better-sqlite3`

2. **环境变量**：
   - 确保将必要的环境变量文件（如 `.env.production`）复制到 standalone 目录中
   - 或者在启动服务前设置环境变量

3. **文件上传**：
   - 确保上传目录在服务器上存在并有正确权限
   - 考虑使用环境变量配置上传路径，使其指向服务器上的固定位置

4. **数据库文件**：
   - 如果使用 SQLite，确保数据库文件在服务器上可用
   - 考虑使用环境变量配置数据库路径

## 故障排除

如果在使用 Standalone 模式时遇到问题：

1. **检查日志**：
   ```bash
   pm2 logs qiaomu-blog
   ```

2. **验证文件权限**：
   ```bash
   ls -la .next/standalone/
   ```

3. **测试数据库连接**：
   ```bash
   cd .next/standalone
   node -e "try { require('better-sqlite3')('./demo.db'); console.log('SQLite连接成功'); } catch(e) { console.error('SQLite连接失败:', e); }"
   ```

4. **如果问题持续存在**，可以回退到传统部署方式。
