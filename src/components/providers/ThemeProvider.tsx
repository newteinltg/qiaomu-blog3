'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  // 初始化主题
  useEffect(() => {
    // 检查是否在后台管理界面
    const isAdminPage = window.location.pathname.startsWith('/admin');

    // 如果是后台管理界面，始终使用浅色主题
    if (isAdminPage) {
      setTheme('light');
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
      setMounted(true);
      return;
    }

    // 前台页面的主题处理
    // 检查本地存储中的主题设置
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    // 检查系统偏好
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // 确定初始主题
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    setTheme(initialTheme);

    // 应用主题到 HTML 元素
    const html = document.documentElement;
    if (initialTheme === 'dark') {
      html.classList.add('dark');
      html.classList.remove('light');
    } else {
      html.classList.add('light');
      html.classList.remove('dark');
    }

    setMounted(true);
  }, []);

  // 切换主题
  const toggleTheme = () => {
    // 检查是否在后台管理界面
    const isAdminPage = window.location.pathname.startsWith('/admin');

    // 如果是后台管理界面，不允许切换主题
    if (isAdminPage) {
      return;
    }

    const html = document.documentElement;
    const newTheme = theme === 'light' ? 'dark' : 'light';

    // 更新状态
    setTheme(newTheme);

    // 更新 HTML 类
    if (newTheme === 'dark') {
      html.classList.add('dark');
      html.classList.remove('light');
    } else {
      html.classList.add('light');
      html.classList.remove('dark');
    }

    // 保存到本地存储
    localStorage.setItem('theme', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
