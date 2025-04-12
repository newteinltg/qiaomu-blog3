#!/bin/bash

# 向阳乔木博客系统一键部署脚本
echo "=== 向阳乔木博客系统一键部署脚本 ==="
echo "此脚本将帮助您快速部署博客系统"
echo

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "错误: 未检测到Node.js，请先安装Node.js 18或更高版本"
    exit 1
fi

# 检查npm是否安装
if ! command -v npm &> /dev/null; then
    echo "错误: 未检测到npm，请先安装npm"
    exit 1
fi

# 检查Node.js版本
NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "错误: Node.js版本过低，需要18或更高版本"
    echo "当前版本: $(node -v)"
    exit 1
fi

echo "✓ 环境检查通过"
echo

# 安装依赖
echo "正在安装依赖..."
npm install
if [ $? -ne 0 ]; then
    echo "错误: 安装依赖失败"
    exit 1
fi
echo "✓ 依赖安装完成"
echo

# 初始化数据库
echo "正在初始化数据库..."
npm run init-db
if [ $? -ne 0 ]; then
    echo "错误: 数据库初始化失败"
    exit 1
fi
echo "✓ 数据库初始化完成"
echo

# 创建管理员账户
echo "正在创建管理员账户..."
npm run create-admin
if [ $? -ne 0 ]; then
    echo "错误: 创建管理员账户失败"
    exit 1
fi
echo "✓ 管理员账户创建完成"
echo

# 构建生产版本
echo "正在构建生产版本..."
npm run build
if [ $? -ne 0 ]; then
    echo "错误: 构建失败"
    exit 1
fi
echo "✓ 构建完成"
echo

# 启动服务器
echo "正在启动服务器..."
echo "您可以使用Ctrl+C停止服务器"
echo "或者使用'npm start'命令再次启动服务器"
echo
echo "博客前台: http://localhost:3000"
echo "管理后台: http://localhost:3000/admin"
echo
npm start
