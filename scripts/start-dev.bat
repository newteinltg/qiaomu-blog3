@echo off
setlocal enabledelayedexpansion

:: 定义端口号
set PORT=3000

echo ===== 乔木博客开发环境启动脚本 =====

:: 检查端口是否被占用
echo 检查端口 %PORT% 是否被占用...
netstat -ano | findstr :%PORT% > nul
if %errorlevel% equ 0 (
    echo 端口 %PORT% 已被占用。
    
    :: 获取占用端口的进程PID
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :%PORT%') do (
        set PID=%%a
        goto :found
    )
    
    :found
    echo 找到占用端口的进程 PID: !PID!，正在终止...
    taskkill /F /PID !PID!
    echo 进程已终止。
    
    :: 等待一会儿，确保进程被完全终止
    timeout /t 2 /nobreak > nul
) else (
    echo 端口 %PORT% 未被占用。
)

:: 启动应用
echo 正在启动应用...
npm run dev

endlocal
