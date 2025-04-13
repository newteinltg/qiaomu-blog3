#!/bin/bash

# 重建监控脚本
# 监控.rebuild目录中的触发文件，并在检测到新的触发文件时执行重建

TRIGGER_DIR=".rebuild"
TRIGGER_FILE="$TRIGGER_DIR/trigger.txt"
LOG_FILE="$TRIGGER_DIR/rebuild.log"

# 确保目录存在
mkdir -p "$TRIGGER_DIR"

# 日志函数
log() {
  echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
  echo "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log "启动重建监控脚本"

# 检查触发文件是否存在
if [ -f "$TRIGGER_FILE" ]; then
  # 读取触发文件内容
  TRIGGER_CONTENT=$(cat "$TRIGGER_FILE")
  log "检测到触发文件: $TRIGGER_CONTENT"
  
  # 执行重建
  log "开始执行重建..."
  npm run build >> "$LOG_FILE" 2>&1
  BUILD_RESULT=$?
  
  if [ $BUILD_RESULT -eq 0 ]; then
    log "重建成功完成"
    # 更新触发文件状态
    echo "{\"timestamp\":\"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\",\"status\":\"completed\",\"result\":\"success\"}" > "$TRIGGER_FILE"
  else
    log "重建失败，错误代码: $BUILD_RESULT"
    # 更新触发文件状态
    echo "{\"timestamp\":\"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\",\"status\":\"failed\",\"result\":\"error\",\"code\":$BUILD_RESULT}" > "$TRIGGER_FILE"
  fi
else
  log "未检测到触发文件，无需重建"
fi

log "监控脚本执行完毕"
