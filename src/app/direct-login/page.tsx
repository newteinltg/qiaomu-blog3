'use client';

import { useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function DirectLoginPage() {
  const [status, setStatus] = useState('准备登录...');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function performLogin() {
      try {
        setStatus('正在登录...');
        
        // 使用固定的登录凭据
        const result = await signIn('credentials', {
          redirect: false,
          email: 'vista8@gmail.com',
          password: 'qq778899',
        });

        console.log('登录结果:', result);

        if (result?.error) {
          setError(result.error);
          setStatus('登录失败');
        } else {
          setStatus('登录成功，正在跳转...');
          
          // 使用window.location直接跳转，避免Next.js路由问题
          window.location.href = '/admin';
        }
      } catch (err) {
        console.error('登录错误:', err);
        setError(err instanceof Error ? err.message : '未知错误');
        setStatus('登录过程中发生错误');
      }
    }

    performLogin();
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-6 text-center text-2xl font-bold">自动登录</h1>
        
        <div className="mb-4 rounded-md bg-blue-50 p-4 text-center text-blue-700">
          {status}
        </div>
        
        {error && (
          <div className="mt-4 rounded-md bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
