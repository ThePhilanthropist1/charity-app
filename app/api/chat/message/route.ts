import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { userId, content } = await request.json();

    if (!userId || !content?.trim()) {
      return NextResponse.json({ error: 'Missing userId or content' }, { status: 400 });
    }

    if (content.trim().length > 500) {
      return NextResponse.json({ error: 'Message too long' }, { status: 400 });
    }

    // Verify user exists
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { data, error } = await supabaseAdmin
      .from('community_messages')
      .insert({ user_id: userId, content: content.trim() })
      .select('id, user_id, content, created_at')
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, message: data });
  } catch (error: any) {
    console.error('[chat] Insert error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}