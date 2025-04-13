/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 禁用ESLint检查，解决Vercel部署问题
  eslint: {
    ignoreDuringBuilds: true,
  },
  // 添加对 @uiw/react-md-editor 的完整支持
  webpack: (config, { isServer }) => {
    // 处理 @uiw/react-md-editor 的兼容性问题
    if (!isServer) {
      // 客户端构建时的特殊处理
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
      };
    }

    // 添加必要的解析器
    config.module.rules.push({
      test: /\.m?js$/,
      resolve: {
        fullySpecified: false,
      },
    });

    return config;
  },
  // 确保上传的图片在生产环境中能够正确显示
  images: {
    domains: ['localhost', 'blog.qiaomu.life'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: '**',
        pathname: '/uploads/**',
      },
    ],
    // 禁用图片优化，直接使用原始图片
    unoptimized: true
  },
  // 确保静态文件正确服务
  // output: 'standalone', // 临时注释掉，方便本地测试
  // 外部包配置，用于静态资源处理
  serverExternalPackages: ['sharp'],
  // 实验性功能
  experimental: {
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate'
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;
