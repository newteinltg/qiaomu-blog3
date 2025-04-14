#!/bin/bash

# 定义端口号
PORT=3000

# 检查端口是否被占用
check_port() {
  echo "检查端口 $PORT 是否被占用..."
  if lsof -i :$PORT > /dev/null; then
    echo "端口 $PORT 已被占用。"
    return 0
  else
    echo "端口 $PORT 未被占用。"
    return 1
  fi
}

# 杀死占用端口的进程
kill_process() {
  echo "正在杀死占用端口 $PORT 的进程..."
  # 获取占用端口的进程PID
  PID=$(lsof -t -i :$PORT)
  if [ -n "$PID" ]; then
    echo "找到占用端口的进程 PID: $PID，正在终止..."
    kill -9 $PID
    echo "进程已终止。"
  else
    echo "未找到占用端口的进程。"
  fi
}

# 启动应用
start_app() {
  echo "正在启动应用..."
  npm run dev
}

# 主流程
main() {
  echo "===== 乔木博客开发环境启动脚本 ====="
  
  # 检查端口是否被占用，如果被占用则杀死进程
  if check_port; then
    kill_process
    # 等待一会儿，确保进程被完全终止
    sleep 2
  fi
  
  # 启动应用
  start_app
}

# 执行主流程
main
