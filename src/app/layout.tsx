import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "../styles/navigation.css";
import "../styles/article.css";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import ScriptLoader from "@/components/ScriptLoader";
import { usePathname } from "next/navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "向阳乔木的个人博客",
  description: "向阳乔木的个人博客网站 - 分享技术、生活和思考",
  authors: [{ name: "向阳乔木" }],
  creator: "向阳乔木",
  publisher: "向阳乔木",
  icons: {
    icon: [
      { url: '/icon/web/favicon.ico' },
      { url: '/icon/web/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon/web/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icon/web/apple-touch-icon.png' },
    ],
    other: [
      { url: '/icon/web/icon-192-maskable.png', sizes: '192x192', type: 'image/png', rel: 'mask-icon' },
      { url: '/icon/web/icon-512-maskable.png', sizes: '512x512', type: 'image/png', rel: 'mask-icon' },
    ],
  },
  manifest: '/manifest.json',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 获取当前时间戳，用于强制刷新缓存
  const timestamp = new Date().getTime();
  
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <link rel="shortcut icon" href={`/icon/web/favicon.ico?v=${timestamp}`} />
        <link rel="apple-touch-icon" href="/icon/web/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="向阳乔木的博客" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="msapplication-TileColor" content="#ffffff" />
        <meta name="msapplication-tap-highlight" content="no" />
        {/* Umami流量统计脚本 */}
        <script defer src="https://cloud.umami.is/script.js" data-website-id="b1135309-3118-4fac-bcbe-868247a90834"></script>
        {/* 动态加载头部脚本 */}
        <ScriptLoader position="head" key={`head-${timestamp}`} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100`}
      >
        {/* 动态加载正文开始脚本 */}
        <ScriptLoader position="body_start" key={`body-start-${timestamp}`} />

        <SessionProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </SessionProvider>

        {/* 动态加载正文结束脚本 */}
        <ScriptLoader position="body_end" key={`body-end-${timestamp}`} />
      </body>
    </html>
  );
}
