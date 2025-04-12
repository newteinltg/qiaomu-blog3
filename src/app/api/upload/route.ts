import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { media } from '@/lib/schema';
import { join } from 'path';
import { mkdir, writeFile } from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

// 确保上传目录存在
async function ensureUploadDir(subDir = '') {
  const baseDir = join(process.cwd(), 'public', 'uploads');
  const uploadDir = subDir ? join(baseDir, subDir) : baseDir;

  try {
    await mkdir(uploadDir, { recursive: true });

    // 检查目录权限
    try {
      // 尝试创建一个临时文件来测试写入权限
      const testFile = join(uploadDir, '.permission_test');
      await writeFile(testFile, 'test');
      // 删除测试文件
      const fs = require('fs');
      fs.unlinkSync(testFile);
    } catch (permError) {
      console.error('上传目录权限不足:', permError);
      throw new Error('上传目录权限不足，无法写入文件');
    }

    return uploadDir;
  } catch (error) {
    console.error('创建上传目录失败:', error);
    throw error;
  }
}

// 处理图片压缩
async function optimizeImage(buffer: Buffer, mimeType: string): Promise<Buffer> {
  try {
    let sharpInstance = sharp(buffer);

    // 根据图片类型选择适当的压缩方法
    if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
      // JPEG优化: 保持较高质量以保证无损压缩
      sharpInstance = sharpInstance.jpeg({ quality: 85, mozjpeg: true });
    } else if (mimeType === 'image/png') {
      // PNG优化: 使用无损压缩
      sharpInstance = sharpInstance.png({ compressionLevel: 9, adaptiveFiltering: true });
    } else if (mimeType === 'image/webp') {
      // WebP优化
      sharpInstance = sharpInstance.webp({ quality: 85, lossless: false });
    } else if (mimeType === 'image/gif') {
      // GIF不做处理，直接返回原始buffer
      return buffer;
    }

    // 调整图片大小，如果宽度超过1920px
    const metadata = await sharpInstance.metadata();
    if (metadata.width && metadata.width > 1920) {
      sharpInstance = sharpInstance.resize(1920);
    }

    // 返回处理后的图片buffer
    return await sharpInstance.toBuffer();
  } catch (error) {
    console.error('图片优化失败:', error);
    // 如果处理失败，返回原始buffer
    return buffer;
  }
}

export async function POST(request: NextRequest) {
  try {
    // 获取表单数据
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const uploadType = formData.get('type') as string || 'general';

    if (!file) {
      return NextResponse.json({ error: '未提供文件' }, { status: 400 });
    }

    // 检查文件类型
    const fileType = file.type;
    if (!fileType.startsWith('image/')) {
      return NextResponse.json({ error: '仅支持图片文件' }, { status: 400 });
    }

    // 读取文件内容
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 优化图片
    const optimizedBuffer = await optimizeImage(buffer, fileType);

    // 确定上传子目录
    let subDir = '';
    if (uploadType === 'contact') {
      subDir = 'contact';
    } else if (uploadType === 'donation') {
      subDir = 'donation';
    }

    // 生成唯一文件名
    const fileName = `${uuidv4()}.${fileType.split('/')[1]}`;
    const uploadDir = await ensureUploadDir(subDir);
    const filePath = join(uploadDir, fileName);
    const publicUrl = subDir ? `/uploads/${subDir}/${fileName}` : `/uploads/${fileName}`;

    // 写入文件
    await writeFile(filePath, optimizedBuffer);

    // 获取图片尺寸
    let width = 0;
    let height = 0;

    try {
      const metadata = await sharp(optimizedBuffer).metadata();
      width = metadata.width || 0;
      height = metadata.height || 0;
    } catch (err) {
      console.error('获取图片尺寸失败:', err);
    }

    // 如果是联系方式或打赏信息的上传，直接返回 URL
    if (uploadType === 'contact' || uploadType === 'donation') {
      return NextResponse.json({
        success: true,
        url: publicUrl,
        fileName: fileName,
        width,
        height,
      });
    }

    // 其他类型的上传，保存到数据库
    const result = await db.insert(media).values({
      url: publicUrl,
      altText: file.name,
      width,
      height,
    }).returning();

    return NextResponse.json({
      success: true,
      file: {
        id: result[0].id,
        url: publicUrl,
        name: file.name,
        type: fileType,
        size: optimizedBuffer.length,
        width,
        height,
      }
    });
  } catch (error) {
    console.error('上传文件时出错:', error);
    return NextResponse.json({ error: '上传文件失败' }, { status: 500 });
  }
}
