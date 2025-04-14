import { NextRequest, NextResponse } from 'next/server';
import { getLink, updateLink, deleteLink } from '@/lib/actions/links';

// GET - 获取单个链接
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    const link = await getLink(id);

    return NextResponse.json(link);
  } catch (error) {
    console.error('获取链接失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '获取链接失败' },
      { status: 500 }
    );
  }
}

// PUT - 更新链接
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    const data = await request.json();

    const link = await updateLink(id, data);

    return NextResponse.json({
      success: true,
      message: '链接更新成功',
      link
    });
  } catch (error) {
    console.error('更新链接失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '更新链接失败' },
      { status: 500 }
    );
  }
}

// DELETE - 删除链接
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    await deleteLink(id);

    return NextResponse.json({
      success: true,
      message: '链接删除成功'
    });
  } catch (error) {
    console.error('删除链接失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '删除链接失败' },
      { status: 500 }
    );
  }
}
