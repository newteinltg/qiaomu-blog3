'use client';

import { useState, useEffect } from 'react';
import SimpleMobileMenu from '@/components/SimpleMobileMenu';

export default function MenuTestPage() {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    // 获取菜单数据
    const fetchMenus = async () => {
      try {
        const response = await fetch('/api/menus');
        if (!response.ok) {
          throw new Error('Failed to fetch menus');
        }
        const data = await response.json();
        setMenus(data);
      } catch (err: any) {
        setError(err.message);
        console.error('Error fetching menus:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMenus();
  }, []);

  // 如果没有真实数据，使用模拟数据
  const mockMenus = [
    { id: 1, name: 'AI工具', url: '/ai-tools', isExternal: 0, parentId: null, order: 1, isActive: 1 },
    { id: 2, name: 'ChatGPT', url: '/ai-tools/chatgpt', isExternal: 0, parentId: 1, order: 1, isActive: 1 },
    { id: 3, name: 'Claude', url: '/ai-tools/claude', isExternal: 0, parentId: 1, order: 2, isActive: 1 },
    { id: 4, name: 'AI教程', url: '/ai-tutorials', isExternal: 0, parentId: 1, order: 3, isActive: 1 },
    { id: 5, name: '入门教程', url: '/ai-tutorials/beginner', isExternal: 0, parentId: 4, order: 1, isActive: 1 },
    { id: 6, name: '进阶教程', url: '/ai-tutorials/intermediate', isExternal: 0, parentId: 4, order: 2, isActive: 1 },
    { id: 7, name: '未分类', url: '/uncategorized', isExternal: 0, parentId: null, order: 2, isActive: 1 },
    { id: 8, name: 'Prompt分享', url: '/prompts', isExternal: 0, parentId: 1, order: 4, isActive: 1 },
    { id: 9, name: '写作Prompt', url: '/prompts/writing', isExternal: 0, parentId: 8, order: 1, isActive: 1 },
    { id: 10, name: '编程Prompt', url: '/prompts/coding', isExternal: 0, parentId: 8, order: 2, isActive: 1 },
  ];

  const displayMenus = menus.length > 0 ? menus : mockMenus;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">移动菜单测试页面</h1>
      
      <div className="mb-4">
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          onClick={() => setShowMenu(!showMenu)}
        >
          {showMenu ? '关闭菜单' : '打开菜单'}
        </button>
      </div>
      
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-2">菜单数据</h2>
        {loading ? (
          <p>加载中...</p>
        ) : error ? (
          <p className="text-red-500">错误: {error}</p>
        ) : (
          <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-60">
            {JSON.stringify(displayMenus, null, 2)}
          </pre>
        )}
      </div>
      
      {showMenu && <SimpleMobileMenu menus={displayMenus} />}
      
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-2">使用说明</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>点击"打开菜单"按钮显示移动菜单</li>
          <li>测试菜单的展开/折叠功能</li>
          <li>查看调试信息了解菜单状态</li>
          <li>如果API获取失败，将使用模拟数据</li>
        </ul>
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-2">另一种测试方法</h2>
        <p className="mb-2">您也可以访问纯HTML测试页面：</p>
        <a 
          href="/menu-test.html" 
          target="_blank" 
          className="text-blue-500 hover:underline"
        >
          打开HTML测试页面
        </a>
      </div>
    </div>
  );
}
