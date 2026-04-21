import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { userId, content, replyTo } = await request.json();

    if (!userId || !content?.trim())
      return NextResponse.json({ error: 'Missing userId or content' }, { status: 400 });
    if (content.trim().length > 500)
      return NextResponse.json({ error: 'Message too long' }, { status: 400 });

    // Verify user exists and has filled out their profile
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, full_name, profile_picture')
      .eq('id', userId)
      .single();

    if (!user)
      return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (!user.full_name?.trim())
      return NextResponse.json({ error: 'PROFILE_INCOMPLETE', field: 'name' }, { status: 403 });

    if (!user.profile_picture?.trim())
      return NextResponse.json({ error: 'PROFILE_INCOMPLETE', field: 'photo' }, { status: 403 });

    const insert: any = { user_id: userId, content: content.trim() };
    if (replyTo) insert.reply_to = replyTo;

    const { data, error } = await supabaseAdmin
      .from('community_messages')
      .insert(insert)
      .select('id, user_id, content, created_at, reply_to, edited')
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, message: data });
  } catch (error: any) {
    console.error('[chat] Insert error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { userId, messageId, content } = await request.json();

    if (!userId || !messageId || !content?.trim())
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    if (content.trim().length > 500)
      return NextResponse.json({ error: 'Message too long' }, { status: 400 });

    // Only owner can edit
    const { data: msg } = await supabaseAdmin
      .from('community_messages').select('user_id').eq('id', messageId).single();
    if (!msg || msg.user_id !== userId)
      return NextResponse.json({ error: 'Not allowed' }, { status: 403 });

    const { data, error } = await supabaseAdmin
      .from('community_messages')
      .update({ content: content.trim(), edited: true, edited_at: new Date().toISOString() })
      .eq('id', messageId)
      .select('id, content, edited')
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, message: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId, messageId } = await request.json();

    if (!userId || !messageId)
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    // Only owner can delete
    const { data: msg } = await supabaseAdmin
      .from('community_messages').select('user_id').eq('id', messageId).single();
    if (!msg || msg.user_id !== userId)
      return NextResponse.json({ error: 'Not allowed' }, { status: 403 });

    await supabaseAdmin.from('community_messages').delete().eq('id', messageId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  // Report a message
  try {
    const { userId, messageId } = await request.json();

    if (!userId || !messageId)
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    // Insert report (unique constraint prevents double-reporting)
    const { error } = await supabaseAdmin
      .from('message_reports')
      .insert({ message_id: messageId, user_id: userId });

    if (error?.code === '23505')
      return NextResponse.json({ error: 'Already reported' }, { status: 409 });
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}