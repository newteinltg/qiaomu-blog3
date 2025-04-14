// 现在我们使用弹出窗口而不是直接点击图标发送请求
// 所有的逻辑都移到了 popup.js 中

// 安装插件时的初始化逻辑
chrome.runtime.onInstalled.addListener(() => {
  console.log('插件已安装');
});

// 浏览器启动时的初始化逻辑
chrome.runtime.onStartup.addListener(() => {
  console.log('浏览器已启动');
});

// 消息监听器，可以与 popup.js 通信
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('收到消息:', message);

  // 如果需要处理消息，可以在这里添加逻辑

  // 返回响应
  sendResponse({ received: true });
  return true; // 表示异步响应
});