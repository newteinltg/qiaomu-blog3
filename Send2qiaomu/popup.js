// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', async () => {
  // 获取当前活动标签页
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // 获取页面元素
  const titleInput = document.getElementById('title');
  const descriptionInput = document.getElementById('description');
  const tagsInput = document.getElementById('tags');
  const isVisibleCheckbox = document.getElementById('isVisible');
  const saveBtn = document.getElementById('saveBtn');
  const cancelBtn = document.getElementById('cancelBtn');
  const statusDiv = document.getElementById('status');
  const urlPreview = document.getElementById('urlPreview');

  // 填充表单
  titleInput.value = tab.title || '';
  urlPreview.textContent = tab.url || '';

  // 默认描述
  descriptionInput.value = '';

  // 默认标签
  tagsInput.value = '';

  // 保存按钮点击事件
  saveBtn.addEventListener('click', async () => {
    try {
      saveBtn.disabled = true;
      saveBtn.textContent = '保存中...';

      // 获取表单数据
      const title = titleInput.value.trim();
      const description = descriptionInput.value.trim();
      const tagsText = tagsInput.value.trim();

      // 验证标题
      if (!title) {
        throw new Error('标题不能为空');
      }

      // 处理标签
      let tags;
      if (tagsText) {
        // 将逗号分隔的标签转换为JSON格式
        const tagArray = tagsText.split(',').map(tag => ({
          value: tag.trim()
        })).filter(tag => tag.value); // 过滤空标签

        tags = JSON.stringify(tagArray);
      } else {
        tags = '[]';
      }

      // 构建数据
      const data = {
        title: title,
        url: tab.url,
        description: description,
        coverImage: tab.favIconUrl || '',
        tags: tags,
        isVisible: isVisibleCheckbox.checked ? 1 : 0,
        // 添加固定验证码，这样就不需要每次都输入
        verificationCode: '乔木' // 使用中文“乔木”作为验证码
      };

      console.log('准备发送的内容:', JSON.stringify(data, null, 2));

      // 发送请求
      // 本地测试环境
      const apiUrl = 'http://localhost:3000/api/links/webhook';

      // 生产环境
      // const apiUrl = 'http://www.qiaomu.ai/api/links/webhook';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      // 解析响应
      const responseData = await response.json();
      console.log('响应数据:', responseData);

      if (response.ok) {
        // 显示成功消息
        const successMessage = responseData.isNewLink ? '收藏成功' : '更新成功';

        // 显示成功状态
        statusDiv.textContent = `${successMessage}: ${responseData.link.title}`;
        statusDiv.className = 'status success';

        // 显示通知
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon128.png',
          title: successMessage,
          message: responseData.link.title
        });

        // 提供视觉反馈 - 成功
        chrome.action.setBadgeText({ text: '✓' });
        chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
        chrome.action.setBadgeTextColor({ color: '#FFFFFF' });

        setTimeout(() => {
          chrome.action.setBadgeText({ text: '' });
          window.close(); // 关闭弹窗
        }, 1500);
      } else {
        throw new Error(responseData.error || '请求未成功');
      }
    } catch (error) {
      console.error('发送失败:', error);

      // 显示错误状态
      statusDiv.textContent = `错误: ${error.message}`;
      statusDiv.className = 'status error';

      // 提供视觉反馈 - 失败
      chrome.action.setBadgeText({ text: '✗' });
      chrome.action.setBadgeBackgroundColor({ color: '#F44336' });
      chrome.action.setBadgeTextColor({ color: '#FFFFFF' });

      setTimeout(() => {
        chrome.action.setBadgeText({ text: '' });
      }, 1500);

      // 恢复按钮状态
      saveBtn.disabled = false;
      saveBtn.textContent = '保存';
    }
  });

  // 取消按钮点击事件
  cancelBtn.addEventListener('click', () => {
    window.close();
  });
});
