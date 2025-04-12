import { NextResponse } from 'next/server';

export interface StatsResponse {
  posts: number;
  categories: number;
  tags: number;
  views: number;
  recentPosts: any[];
}

export async function GET(): Promise<NextResponse<StatsResponse>> {
  // 返回空的统计数据
  return NextResponse.json({
    posts: 0,
    categories: 0,
    tags: 0,
    views: 0,
    recentPosts: []
  });
}
