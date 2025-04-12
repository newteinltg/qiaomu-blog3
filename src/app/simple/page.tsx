export default function SimplePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* 头部导航 */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <a href="/" className="text-2xl font-bold">向阳乔木</a>
            <nav className="hidden md:flex items-center space-x-4">
              <a href="/" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400">首页</a>
              <a href="/categories" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400">分类</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero区域 */}
      <section className="bg-gray-50 dark:bg-gray-800 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">向阳乔木个人网站</h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">分享AI探索、实践，精选各类工具，一起学习进步。</p>
          </div>
        </div>
      </section>

      {/* 主内容区 */}
      <main className="flex-grow py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">简化版主页</h2>
          <p className="text-gray-600 dark:text-gray-300">这是一个简化版的主页，用于测试是否有遮罩层问题。</p>
        </div>
      </main>

      {/* 页脚 */}
      <footer className="bg-gray-50 dark:bg-gray-800 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 dark:text-gray-400">© 2025 向阳乔木</p>
        </div>
      </footer>
    </div>
  );
}
