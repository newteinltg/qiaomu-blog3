#!/bin/bash

# 部署脚本 - Standalone 模式
# 使用方法: ./deploy-standalone.sh

echo "开始部署博客 (Standalone 模式)..."

# 拉取最新代码
echo "拉取最新代码..."
git pull origin main

# 安装依赖
echo "安装依赖..."
npm install

# 构建应用
echo "构建应用..."
npm run build

# 准备 standalone 目录
echo "准备 standalone 目录..."
mkdir -p .next/standalone/.next/static
cp -R .next/static .next/standalone/.next/

# 确保上传目录存在
echo "确保上传目录存在..."
mkdir -p .next/standalone/public/uploads
cp -R public/uploads .next/standalone/public/ 2>/dev/null || :

# 复制环境变量文件（如果存在）
if [ -f .env.production ]; then
  echo "复制环境变量文件..."
  cp .env.production .next/standalone/
fi

# 使用 PM2 启动或重启服务
echo "启动服务..."
cd .next/standalone
if pm2 list | grep -q "qiaomu-blog"; then
  pm2 restart qiaomu-blog
else
  pm2 start server.js --name qiaomu-blog
fi

echo "部署完成！"
echo "您的博客现在应该可以通过配置的端口访问了"
