import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/schema';

export async function POST(request: Request) {
  try {
    const { title, slug, content, published } = await request.json();
    
    await db.insert(schema.posts).values({
      title,
      slug,
      content,
      published
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: 'Failed to create post' },
      { status: 500 }
    );
  }
}