// 模拟 nodejieba 模块
module.exports = {
  cut: function(text) {
    // 简单的分词实现，按空格分割
    return text.split(/\s+/);
  }
};
