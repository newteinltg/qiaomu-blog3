// 主题切换脚本
document.addEventListener('DOMContentLoaded', function() {
  const html = document.documentElement;
  const themeToggle = document.getElementById('themeToggle');
  const mobileThemeToggle = document.getElementById('mobileThemeToggle');

  // 使用 data-theme-icon 属性来选择图标，避免水合不匹配
  const lightIcon = document.querySelector('[data-theme-icon="light"].theme-light');
  const darkIcon = document.querySelector('[data-theme-icon="dark"].theme-dark');
  const mobileLightIcon = document.querySelector('[data-theme-icon="light"].mobile-theme-light');
  const mobileDarkIcon = document.querySelector('[data-theme-icon="dark"].mobile-theme-dark');

  // 检查系统偏好
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  // 检查本地存储
  const savedTheme = localStorage.getItem('theme');

  // 初始化主题
  function initTheme() {
    const isDark = savedTheme === 'dark' || (!savedTheme && prefersDark);

    if (isDark) {
      html.classList.remove('light');
      html.classList.add('dark');
      toggleIcons(true);
    } else {
      html.classList.remove('dark');
      html.classList.add('light');
      toggleIcons(false);
    }
  }

  // 切换图标显示
  function toggleIcons(isDark) {
    if (lightIcon && darkIcon) {
      lightIcon.classList.toggle('hidden', isDark);
      darkIcon.classList.toggle('hidden', !isDark);
    }
    if (mobileLightIcon && mobileDarkIcon) {
      mobileLightIcon.classList.toggle('hidden', isDark);
      mobileDarkIcon.classList.toggle('hidden', !isDark);
    }
  }

  // 初始化主题
  initTheme();

  function toggleTheme() {
    const isDark = html.classList.contains('dark');

    if (isDark) {
      // 切换到浅色主题
      html.classList.remove('dark');
      html.classList.add('light');
      toggleIcons(false);
      localStorage.setItem('theme', 'light');
    } else {
      // 切换到深色主题
      html.classList.remove('light');
      html.classList.add('dark');
      toggleIcons(true);
      localStorage.setItem('theme', 'dark');
    }
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }

  if (mobileThemeToggle) {
    mobileThemeToggle.addEventListener('click', toggleTheme);
  }
});
