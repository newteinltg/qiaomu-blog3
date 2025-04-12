import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // 客户端打包配置
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        stream: require.resolve('stream-browserify'),
        buffer: require.resolve('buffer'),
        crypto: require.resolve('crypto-browserify'),
      };
      
      // 处理node:协议的polyfill
      config.plugins.push(new (require('webpack').NormalModuleReplacementPlugin)(
        /^node:/,
        (resource: { request: string }) => {
          resource.request = resource.request.replace(/^node:/, '');
        }
      ));
    }
    return config;
  },
};

export default nextConfig;
