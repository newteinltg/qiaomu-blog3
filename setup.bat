@echo off
echo === 向阳乔木博客系统一键部署脚本 ===
echo 此脚本将帮助您快速部署博客系统
echo.

REM 检查Node.js是否安装
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo 错误: 未检测到Node.js，请先安装Node.js 18或更高版本
    exit /b 1
)

REM 检查npm是否安装
where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo 错误: 未检测到npm，请先安装npm
    exit /b 1
)

echo ✓ 环境检查通过
echo.

REM 安装依赖
echo 正在安装依赖...
call npm install
if %ERRORLEVEL% neq 0 (
    echo 错误: 安装依赖失败
    exit /b 1
)
echo ✓ 依赖安装完成
echo.

REM 初始化数据库
echo 正在初始化数据库...
call npm run init-db
if %ERRORLEVEL% neq 0 (
    echo 错误: 数据库初始化失败
    exit /b 1
)
echo ✓ 数据库初始化完成
echo.

REM 创建管理员账户
echo 正在创建管理员账户...
call npm run create-admin
if %ERRORLEVEL% neq 0 (
    echo 错误: 创建管理员账户失败
    exit /b 1
)
echo ✓ 管理员账户创建完成
echo.

REM 构建生产版本
echo 正在构建生产版本...
call npm run build
if %ERRORLEVEL% neq 0 (
    echo 错误: 构建失败
    exit /b 1
)
echo ✓ 构建完成
echo.

REM 启动服务器
echo 正在启动服务器...
echo 您可以使用Ctrl+C停止服务器
echo 或者使用'npm start'命令再次启动服务器
echo.
echo 博客前台: http://localhost:3000
echo 管理后台: http://localhost:3000/admin
echo.
call npm start
