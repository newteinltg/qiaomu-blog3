import { NextRequest, NextResponse } from 'next/server';
import { createLink } from '@/lib/actions/links';

// 简单的验证码 - 在实际应用中可以使用更复杂的机制
const VALID_CODES = ['qiaomu', '乔木', 'blog'];

// POST - 接收Chrome插件发送的数据
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // 验证必填字段
    if (!data.title || !data.url) {
      return NextResponse.json(
        { error: '标题和URL为必填项' },
        { status: 400 }
      );
    }

    // 验证验证码
    if (!data.verificationCode || !VALID_CODES.includes(data.verificationCode)) {
      return NextResponse.json(
        { error: '验证码无效' },
        { status: 403 }
      );
    }

    // 准备链接数据
    const linkData = {
      title: data.title,
      url: data.url,
      description: data.description || '',
      coverImage: data.coverImage || '',
      tags: data.tags || '[]'
    };

    // 创建或更新链接
    const link = await createLink(linkData);

    // 根据是否有创建时间和更新时间判断是新建还是更新
    const isNewLink = link.createdAt === link.updatedAt;

    return NextResponse.json({
      success: true,
      message: isNewLink ? '链接创建成功' : '链接更新成功',
      link,
      isNewLink
    });
  } catch (error) {
    console.error('通过Webhook创建链接失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '创建链接失败' },
      { status: 500 }
    );
  }
}
