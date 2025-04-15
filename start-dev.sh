#!/bin/bash

# 设置固定端口
PORT=3099

# 检查端口是否被占用
pid=$(lsof -ti :$PORT)
if [ ! -z "$pid" ]; then
    echo "Port $PORT is in use by process $pid. Killing it..."
    kill -9 $pid
fi

# 清理旧的构建文件
echo "Cleaning..."
rm -rf .next

# 重新构建项目
echo "Building..."
npm run build

# 启动服务器
echo "Starting server on port $PORT..."
PORT=$PORT npm run start 