import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import fs from 'fs';
import path from 'path';

/**
 * 增强的缓存刷新API端点
 * 使用多种方式确保缓存被刷新
 */
export async function POST(request: NextRequest) {
  try {
    console.log('接收到刷新请求');

    // 获取请求体中的路径参数，默认为首页
    const body = await request.json().catch(() => ({}));
    const { path = '/' } = body;

    // 要刷新的路径列表
    const pathsToRevalidate = [
      path,
      '/',
      '/posts',
      '/categories',
      '/tags',
      '/admin'
    ];

    // 尝试刷新所有路径
    for (const currentPath of pathsToRevalidate) {
      try {
        // 使用Next.js内置方法刷新缓存
        revalidatePath(currentPath);
        console.log(`已刷新路径: ${currentPath}`);
      } catch (e) {
        console.log(`刷新路径 ${currentPath} 时出错: ${e}`);
      }
    }

    // 创建触发文件，确保静态内容被重新生成
    const triggerDir = path.join(process.cwd(), '.next', 'cache');
    const triggerFile = path.join(triggerDir, `revalidate-trigger-${Date.now()}.txt`);
    
    try {
      if (!fs.existsSync(triggerDir)) {
        fs.mkdirSync(triggerDir, { recursive: true });
      }
      fs.writeFileSync(triggerFile, `Triggered revalidation at ${new Date().toISOString()}`);
      console.log(`创建触发文件: ${triggerFile}`);
    } catch (e) {
      console.error(`创建触发文件失败: ${e}`);
    }

    return NextResponse.json({
      success: true,
      message: '缓存已刷新，请刷新页面查看最新内容',
      timestamp: new Date().toISOString(),
      paths: pathsToRevalidate
    });
  } catch (error) {
    console.error('处理刷新请求时出错:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: '处理请求失败',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
