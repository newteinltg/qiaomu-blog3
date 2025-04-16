// 更健壮的 Standalone 启动脚本
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

// 确保 .next/standalone 目录存在
const standaloneDir = path.join(__dirname, '.next', 'standalone');
if (!fs.existsSync(standaloneDir)) {
  console.error('Standalone 目录不存在。请先运行 npm run build');
  process.exit(1);
}

// 确保静态资源目录存在
const staticDir = path.join(standaloneDir, '.next', 'static');
if (!fs.existsSync(staticDir)) {
  console.log('复制静态资源...');
  fs.mkdirSync(path.join(standaloneDir, '.next'), { recursive: true });
  fs.cpSync(path.join(__dirname, '.next', 'static'), staticDir, { recursive: true });
}

// 确保 public 目录存在
const publicDir = path.join(standaloneDir, 'public');
if (!fs.existsSync(publicDir)) {
  console.log('复制 public 目录...');
  fs.cpSync(path.join(__dirname, 'public'), publicDir, { recursive: true });
}

// 启动服务器
console.log('启动 Standalone 服务器...');
const port = process.env.PORT || 3099;
console.log(`端口: ${port}`);

// 使用 arch -x86_64 启动 Node.js（在 Apple Silicon Mac 上）
const isAppleSilicon = process.arch === 'arm64';
let serverProcess;

if (isAppleSilicon) {
  console.log('检测到 Apple Silicon，使用 Rosetta 2 运行...');
  serverProcess = spawn('arch', ['-x86_64', 'node', path.join(standaloneDir, 'server.js')], {
    env: { ...process.env, PORT: port },
    stdio: 'inherit'
  });
} else {
  serverProcess = spawn('node', [path.join(standaloneDir, 'server.js')], {
    env: { ...process.env, PORT: port },
    stdio: 'inherit'
  });
}

// 处理进程事件
serverProcess.on('error', (err) => {
  console.error('启动服务器时出错:', err);
  process.exit(1);
});

serverProcess.on('close', (code) => {
  console.log(`服务器进程退出，退出码: ${code}`);
  process.exit(code);
});

// 处理终止信号
process.on('SIGINT', () => {
  console.log('接收到 SIGINT 信号，正在关闭服务器...');
  serverProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('接收到 SIGTERM 信号，正在关闭服务器...');
  serverProcess.kill('SIGTERM');
});
