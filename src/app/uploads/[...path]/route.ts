import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import fs from 'fs';

/**
 * 处理上传文件的静态资源访问
 * 这个路由处理器确保上传到 public/uploads 目录的文件可以被正确访问
 * 特别是在生产环境中，避免中间件拦截静态资源请求
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    // 获取请求的路径
    const { path } = await params;
    
    console.log('静态资源请求路径:', path);
    
    // 构建文件路径
    const filePath = join(process.cwd(), 'public', 'uploads', ...path);
    console.log('完整文件路径:', filePath);
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      console.error(`文件不存在: ${filePath}`);
      return new NextResponse(`文件不存在: ${path.join('/')}`, { status: 404 });
    }
    
    // 获取文件信息
    try {
      const stats = fs.statSync(filePath);
      console.log('文件信息:', {
        size: stats.size,
        isFile: stats.isFile(),
        created: stats.birthtime,
        modified: stats.mtime
      });
      
      if (!stats.isFile()) {
        console.error(`请求的路径不是文件: ${filePath}`);
        return new NextResponse('请求的路径不是文件', { status: 400 });
      }
    } catch (statError) {
      console.error('获取文件信息失败:', statError);
    }
    
    // 读取文件内容
    const fileBuffer = fs.readFileSync(filePath);
    console.log(`成功读取文件，大小: ${fileBuffer.length} 字节`);
    
    // 确定文件的MIME类型
    let contentType = 'application/octet-stream';
    const fileName = path[path.length - 1] || '';
    
    if (fileName.endsWith('.png')) {
      contentType = 'image/png';
    } else if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) {
      contentType = 'image/jpeg';
    } else if (fileName.endsWith('.gif')) {
      contentType = 'image/gif';
    } else if (fileName.endsWith('.webp')) {
      contentType = 'image/webp';
    } else if (fileName.endsWith('.svg')) {
      contentType = 'image/svg+xml';
    }
    
    console.log('文件类型:', contentType);
    
    // 返回文件内容
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('访问上传文件时出错:', error);
    return new NextResponse('服务器错误: ' + (error instanceof Error ? error.message : String(error)), { status: 500 });
  }
}
