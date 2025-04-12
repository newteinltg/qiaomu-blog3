'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function PreviewLoginPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('正在准备预览登录...');
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [redirectCountdown, setRedirectCountdown] = useState(5);
  const router = useRouter();

  useEffect(() => {
    const loginToAdmin = async () => {
      try {
        setLoading(true);
        setMessage('正在尝试预览登录...');
        
        // Call the admin bypass endpoint
        const response = await fetch('/api/admin-bypass');
        const data = await response.json();
        
        setDebugInfo({
          timestamp: new Date().toISOString(),
          response: {
            status: response.status,
            ok: response.ok,
            data
          }
        });
        
        if (response.ok && data.success) {
          setMessage('登录成功！正在准备跳转到管理后台...');
          
          // Start countdown for redirection
          let count = 5;
          setRedirectCountdown(count);
          
          const countdownInterval = setInterval(() => {
            count--;
            setRedirectCountdown(count);
            
            if (count <= 0) {
              clearInterval(countdownInterval);
              
              // Try multiple redirection methods
              try {
                console.log('Attempting redirection to admin...');
                
                // Method 1: Direct window location change
                window.location.href = '/admin';
                
                // Method 2: After a short delay, try router push
                setTimeout(() => {
                  try {
                    console.log('Fallback: Using router.push...');
                    router.push('/admin');
                    
                    // Method 3: After another delay, try direct assignment
                    setTimeout(() => {
                      console.log('Last resort: Direct location assignment...');
                      window.location.assign('/admin');
                    }, 1000);
                  } catch (routerError) {
                    console.error('Router push failed:', routerError);
                  }
                }, 1000);
              } catch (redirectError) {
                console.error('Redirection error:', redirectError);
                setMessage(`跳转出错: ${redirectError instanceof Error ? redirectError.message : '未知错误'}`);
              }
            }
          }, 1000);
        } else {
          setMessage(`登录失败: ${data.error || '未知错误'}`);
        }
      } catch (error) {
        console.error('Preview login error:', error);
        setMessage(`登录出错: ${error instanceof Error ? error.message : '未知错误'}`);
        setDebugInfo({
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : String(error)
        });
      } finally {
        setLoading(false);
      }
    };

    // Start the login process after a short delay
    const timer = setTimeout(() => {
      loginToAdmin();
    }, 500);

    return () => clearTimeout(timer);
  }, [router]);

  // Add a manual redirect button
  const handleManualRedirect = () => {
    try {
      window.location.href = '/admin';
    } catch (error) {
      console.error('Manual redirect error:', error);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">预览模式登录</h1>
      
      <div className="mb-6 text-center">
        <p className="mb-4">{message}</p>
        {loading && (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
          </div>
        )}
        
        {redirectCountdown > 0 && redirectCountdown < 5 && (
          <p className="mt-2 text-sm text-gray-600">
            {redirectCountdown} 秒后自动跳转...
          </p>
        )}
      </div>
      
      <div className="mt-6 text-center">
        <button
          onClick={handleManualRedirect}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          手动跳转到管理后台
        </button>
        
        <p className="text-sm text-gray-500 mt-4">
          此页面专为预览模式设计，自动登录管理后台。
        </p>
        <p className="text-sm text-gray-500 mt-2">
          如需正常登录，请访问 <a href="/login" className="text-blue-500 underline">登录页面</a>
        </p>
      </div>
      
      {Object.keys(debugInfo).length > 0 && (
        <div className="mt-6 p-4 bg-gray-100 rounded overflow-auto max-h-60">
          <h3 className="font-bold mb-2">Debug Information:</h3>
          <pre className="text-xs">{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
