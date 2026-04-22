import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';

const APP_URL  = process.env.NEXT_PUBLIC_APP_URL || 'https://www.charitytoken.net';
const RESEND   = process.env.RESEND_API_KEY || '';

// ── Send notification email ───────────────────────────────────────────────────
async function sendNotifEmail(
  to: string, name: string,
  type: 'like' | 'reply' | 'mention',
  actorName: string, preview: string, messageId: string
) {
  if (!RESEND) return;
  const subject =
    type === 'like'    ? `${actorName} liked your message 💚` :
    type === 'reply'   ? `${actorName} replied to your message 💬` :
                         `${actorName} mentioned you in chat 👋`;
  const action =
    type === 'like'    ? `liked your message` :
    type === 'reply'   ? `replied to your message` :
                         `mentioned you in Community Chat`;
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0A1628;font-family:Arial,sans-serif;">
<div style="max-width:520px;margin:40px auto;background:#0F1F35;border-radius:16px;overflow:hidden;border:1px solid rgba(0,206,201,0.2);">
  <div style="height:4px;background:linear-gradient(to right,#00CEC9,#00B894);"></div>
  <div style="padding:32px 28px;text-align:center;">
    <img src="${APP_URL}/Charity token logo.jpg" alt="CT" style="width:56px;height:56px;border-radius:12px;border:2px solid rgba(0,206,201,0.4);margin-bottom:16px;">
    <p style="font-size:11px;font-weight:700;letter-spacing:2px;color:#00CEC9;margin:0 0 10px;text-transform:uppercase;">Community Chat</p>
    <h2 style="font-size:20px;font-weight:900;color:white;margin:0 0 8px;">${subject}</h2>
    <p style="font-size:14px;color:#8FA3BF;margin:0 0 20px;">Hi ${name}, <strong style="color:white;">${actorName}</strong> ${action}.</p>
    <div style="padding:14px 18px;background:rgba(0,206,201,0.05);border:1px solid rgba(0,206,201,0.15);border-left:4px solid #00CEC9;border-radius:10px;margin-bottom:24px;text-align:left;">
      <p style="font-size:13px;color:#B0C8D8;margin:0;font-style:italic;">"${preview}"</p>
    </div>
    <a href="${APP_URL}/beneficiary-dashboard?tab=chat&msg=${messageId}"
       style="display:inline-block;padding:13px 32px;border-radius:12px;background:linear-gradient(to right,#00CEC9,#00B894);color:#020C1B;font-weight:800;font-size:14px;text-decoration:none;">
      View in Chat →
    </a>
    <p style="font-size:11px;color:#4A5568;margin:24px 0 0;padding-top:16px;border-top:1px solid rgba(255,255,255,0.06);">
      Charity Token Project · charitytoken.net
    </p>
  </div>
  <div style="height:4px;background:linear-gradient(to right,#00B894,#00CEC9);"></div>
</div>
</body></html>`;
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'Charity Token <info@charitytoken.net>', to, subject, html }),
    });
  } catch (e) { console.error('[notif email]', e); }
}

// ── Insert notification + optionally email ────────────────────────────────────
async function createNotification(
  userId: string, type: 'like'|'reply'|'mention',
  actorId: string, messageId: string, content: string
) {
  // Don't notify yourself
  if (userId === actorId) return;

  await supabaseAdmin.from('notifications').insert({
    user_id: userId, type, actor_id: actorId, message_id: messageId, content,
  });

  // Send email
  const [{ data: recipient }, { data: actor }] = await Promise.all([
    supabaseAdmin.from('users').select('full_name, email').eq('id', userId).single(),
    supabaseAdmin.from('users').select('full_name').eq('id', actorId).single(),
  ]);
  if (recipient?.email && actor?.full_name) {
    const name = recipient.full_name?.split(' ')[0] || 'there';
    await sendNotifEmail(recipient.email, name, type, actor.full_name, content, messageId);
  }
}

// ── POST: Send message ────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const { userId, content, replyTo, mentions } = await request.json();
    if (!userId || !content?.trim())
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    if (content.trim().length > 500)
      return NextResponse.json({ error: 'Message too long' }, { status: 400 });

    const { data: user } = await supabaseAdmin
      .from('users').select('id, full_name, profile_picture').eq('id', userId).single();
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (!user.full_name?.trim())
      return NextResponse.json({ error: 'PROFILE_INCOMPLETE', field: 'name' }, { status: 403 });
    if (!user.profile_picture?.trim())
      return NextResponse.json({ error: 'PROFILE_INCOMPLETE', field: 'photo' }, { status: 403 });

    const insert: any = { user_id: userId, content: content.trim() };
    if (replyTo) insert.reply_to = replyTo;
    if (mentions?.length) insert.mentions = mentions;

    const { data: msg, error } = await supabaseAdmin
      .from('community_messages')
      .insert(insert)
      .select('id, user_id, content, created_at, reply_to, edited, mentions')
      .single();
    if (error) throw error;

    // Notify reply target
    if (replyTo) {
      const { data: orig } = await supabaseAdmin
        .from('community_messages').select('user_id, content').eq('id', replyTo).single();
      if (orig) {
        await createNotification(orig.user_id, 'reply', userId, msg.id,
          content.trim().slice(0, 100));
      }
    }

    // Notify mentions
    if (mentions?.length) {
      for (const mentionedId of mentions) {
        await createNotification(mentionedId, 'mention', userId, msg.id,
          content.trim().slice(0, 100));
      }
    }

    return NextResponse.json({ success: true, message: msg });
  } catch (e: any) {
    console.error('[chat POST]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ── PATCH: Edit message ───────────────────────────────────────────────────────
export async function PATCH(request: NextRequest) {
  try {
    const { userId, messageId, content } = await request.json();
    if (!userId || !messageId || !content?.trim())
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const { data: msg } = await supabaseAdmin
      .from('community_messages').select('user_id').eq('id', messageId).single();
    if (!msg || msg.user_id !== userId)
      return NextResponse.json({ error: 'Not allowed' }, { status: 403 });

    const { data, error } = await supabaseAdmin
      .from('community_messages')
      .update({ content: content.trim(), edited: true, edited_at: new Date().toISOString() })
      .eq('id', messageId).select('id, content, edited').single();
    if (error) throw error;
    return NextResponse.json({ success: true, message: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ── DELETE: Delete message ────────────────────────────────────────────────────
export async function DELETE(request: NextRequest) {
  try {
    const { userId, messageId } = await request.json();
    if (!userId || !messageId)
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const { data: msg } = await supabaseAdmin
      .from('community_messages').select('user_id').eq('id', messageId).single();
    if (!msg || msg.user_id !== userId)
      return NextResponse.json({ error: 'Not allowed' }, { status: 403 });

    await supabaseAdmin.from('community_messages').delete().eq('id', messageId);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ── PUT: Like / Unlike message ────────────────────────────────────────────────
export async function PUT(request: NextRequest) {
  try {
    const { userId, messageId, action } = await request.json();
    if (!userId || !messageId)
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    if (action === 'report') {
      const { error } = await supabaseAdmin
        .from('message_reports').insert({ message_id: messageId, user_id: userId });
      if (error?.code === '23505')
        return NextResponse.json({ error: 'Already reported' }, { status: 409 });
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    // Like / Unlike
    const { data: existing } = await supabaseAdmin
      .from('message_likes')
      .select('id').eq('message_id', messageId).eq('user_id', userId).maybeSingle();

    if (existing) {
      // Unlike
      await supabaseAdmin.from('message_likes').delete()
        .eq('message_id', messageId).eq('user_id', userId);
      const { count } = await supabaseAdmin
        .from('message_likes').select('*', { count: 'exact', head: true })
        .eq('message_id', messageId);
      return NextResponse.json({ success: true, liked: false, count: count || 0 });
    } else {
      // Like
      await supabaseAdmin.from('message_likes').insert({ message_id: messageId, user_id: userId });
      const { count } = await supabaseAdmin
        .from('message_likes').select('*', { count: 'exact', head: true })
        .eq('message_id', messageId);

      // Notify message owner
      const { data: orig } = await supabaseAdmin
        .from('community_messages').select('user_id, content').eq('id', messageId).single();
      if (orig) {
        await createNotification(orig.user_id, 'like', userId, messageId,
          orig.content.slice(0, 100));
      }
      return NextResponse.json({ success: true, liked: true, count: count || 0 });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}