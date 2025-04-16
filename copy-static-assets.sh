#!/bin/bash

# 复制静态资源到 Standalone 目录的脚本
# 使用方法: ./copy-static-assets.sh

echo "开始复制静态资源到 Standalone 目录..."

# 确保 Standalone 目录存在
mkdir -p .next/standalone/.next/static
cp -R .next/static .next/standalone/.next/

# 复制所有静态资源
echo "复制 public 目录中的所有文件..."
mkdir -p .next/standalone/public
cp -R public/* .next/standalone/public/ 2>/dev/null || :

# 特别确保 favicon 和其他重要图标文件被复制
echo "确保图标文件存在..."
if [ -f public/favicon.ico ]; then
  cp public/favicon.ico .next/standalone/public/
  echo "已复制 favicon.ico"
fi
if [ -f public/icon.png ]; then
  cp public/icon.png .next/standalone/public/
  echo "已复制 icon.png"
fi
if [ -f public/apple-touch-icon.png ]; then
  cp public/apple-touch-icon.png .next/standalone/public/
  echo "已复制 apple-touch-icon.png"
fi

echo "静态资源复制完成！"
