import { NextRequest, NextResponse } from 'next/server';
import { getLinks, createLink } from '@/lib/actions/links';

// GET - 获取所有链接
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tag = searchParams.get('tag');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    const result = await getLinks(tag, page, pageSize);

    return NextResponse.json(result);
  } catch (error) {
    console.error('获取链接列表失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '获取链接列表失败' },
      { status: 500 }
    );
  }
}

// POST - 创建新链接
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const link = await createLink(data);

    return NextResponse.json({
      success: true,
      message: '链接创建成功',
      link
    });
  } catch (error) {
    console.error('创建链接失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '创建链接失败' },
      { status: 500 }
    );
  }
}


