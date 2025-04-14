'use client';

import { useState, useEffect } from 'react';

// 客户端检查管理员状态
export default function useAdminCheck() {
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    // 检查cookie中是否有管理员标记
    const hasAdminCookie = document.cookie.split(';').some(item => item.trim().startsWith('admin_logged_in='));
    setIsAdmin(hasAdminCookie);
  }, []);
  
  return isAdmin;
}
