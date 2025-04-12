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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <link rel="shortcut icon" href="/icon/web/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon/web/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon/web/icon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon/web/icon-512.png" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="author" content="向阳乔木" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;500;600;700&family=Noto+Sans+SC:wght@300;400;500;700&display=swap" />
        <link href="https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
        <script src="/js/slider.js" defer></script>
        <script src="/js/mobile-menu.js" defer></script>
        {/* Umami流量统计脚本 */}
        <script defer src="https://cloud.umami.is/script.js" data-website-id="b1135309-3118-4fac-bcbe-868247a90834"></script>
        {/* 动态加载头部脚本 */}
        <ScriptLoader position="head" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100`}
      >
        {/* 动态加载正文开始脚本 */}
        <ScriptLoader position="body_start" />

        <SessionProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </SessionProvider>

        {/* 动态加载正文结束脚本 */}
        <ScriptLoader position="body_end" />
      </body>
    </html>
  );
}
