'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase-client';
import { Send, MessageCircle, Reply, Pencil, Trash2, Flag, X, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

const ROLE_BADGE: Record<string, { label: string; color: string; bg: string; border: string }> = {
  admin:          { label: 'Admin',          color: '#9B59B6', bg: 'rgba(155,89,182,0.18)', border: 'rgba(155,89,182,0.4)' },
  philanthropist: { label: 'Philanthropist', color: '#00B894', bg: 'rgba(0,184,148,0.15)',  border: 'rgba(0,184,148,0.4)'  },
  beneficiary:    { label: 'Beneficiary',    color: '#00CEC9', bg: 'rgba(0,206,201,0.12)',  border: 'rgba(0,206,201,0.35)' },
};
function getBadge(role: string) { return ROLE_BADGE[role] || ROLE_BADGE.beneficiary; }

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

interface ChatMsg {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  reply_to: string | null;
  edited: boolean;
  users: { full_name: string; profile_picture: string | null; role: string } | null;
}

interface Props {
  currentUserId: string;
  currentUserRole: string;
  currentUserName: string;
  currentUserAvatar?: string;
  profileComplete: boolean;
}

export function CommunityChat({ currentUserId, currentUserRole, currentUserName, currentUserAvatar, profileComplete }: Props) {
  const router = useRouter();
  const [messages,   setMessages]   = useState<ChatMsg[]>([]);
  const [input,      setInput]      = useState('');
  const [loading,    setLoading]    = useState(true);
  const [sending,    setSending]    = useState(false);
  const [sendError,  setSendError]  = useState('');
  const [replyTo,    setReplyTo]    = useState<ChatMsg | null>(null);
  const [editingMsg, setEditingMsg] = useState<ChatMsg | null>(null);
  const [editInput,  setEditInput]  = useState('');
  const [swipedId,   setSwipedId]   = useState<string | null>(null);
  const [onlineCount,setOnlineCount]= useState(1);
  const [reported,   setReported]   = useState<Set<string>>(new Set());
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);
  const touchStartX = useRef<number>(0);

  // ── Load messages ─────────────────────────────────────────────────────────
  const loadMessages = useCallback(async () => {
    const { data } = await supabase
      .from('community_messages')
      .select('id, user_id, content, created_at, reply_to, edited, users:user_id(full_name, profile_picture, role)')
      .order('created_at', { ascending: true })
      .limit(100);
    setMessages((data as any) || []);
    setLoading(false);
  }, []);

  // ── Realtime ──────────────────────────────────────────────────────────────
  useEffect(() => {
    loadMessages();
    const channel = supabase.channel('community-chat-v3')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'community_messages' }, async (p) => {
        const { data } = await supabase
          .from('community_messages')
          .select('id, user_id, content, created_at, reply_to, edited, users:user_id(full_name, profile_picture, role)')
          .eq('id', p.new.id).single();
        if (data) setMessages(prev => prev.find(m => m.id === (data as any).id) ? prev : [...prev, data as any]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'community_messages' }, (p) => {
        setMessages(prev => prev.map(m => m.id === p.new.id ? { ...m, content: p.new.content, edited: p.new.edited } : m));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'community_messages' }, (p) => {
        setMessages(prev => prev.filter(m => m.id !== p.old.id));
      })
      .on('presence', { event: 'sync' }, () => {
        setOnlineCount(Math.max(1, Object.keys(channel.presenceState()).length));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') await channel.track({ user_id: currentUserId });
      });
    return () => { supabase.removeChannel(channel); };
  }, [currentUserId, loadMessages]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // ── API helpers ───────────────────────────────────────────────────────────
  const apiCall = (method: string, body: object) =>
    fetch('/api/chat/message', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json());

  // ── Send ──────────────────────────────────────────────────────────────────
  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true); setSendError(''); setInput('');
    const res = await apiCall('POST', { userId: currentUserId, content: text, replyTo: replyTo?.id || null });
    if (!res.success) {
      setInput(text);
      if (res.error === 'PROFILE_INCOMPLETE') {
        setSendError(`Please complete your profile (${res.field === 'name' ? 'add your name' : 'upload a photo'}) before chatting.`);
      } else {
        setSendError(res.error || 'Failed to send.');
      }
    } else {
      setReplyTo(null);
    }
    setSending(false);
    inputRef.current?.focus();
  };

  // ── Edit ──────────────────────────────────────────────────────────────────
  const submitEdit = async () => {
    if (!editingMsg || !editInput.trim()) return;
    const res = await apiCall('PATCH', { userId: currentUserId, messageId: editingMsg.id, content: editInput });
    if (res.success) setEditingMsg(null);
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const deleteMessage = async (msgId: string) => {
    await apiCall('DELETE', { userId: currentUserId, messageId: msgId });
    setSwipedId(null);
  };

  // ── Report ────────────────────────────────────────────────────────────────
  const reportMessage = async (msgId: string) => {
    if (reported.has(msgId)) return;
    const res = await apiCall('PUT', { userId: currentUserId, messageId: msgId });
    if (res.success || res.error === 'Already reported') {
      setReported(prev => new Set([...prev, msgId]));
      setSwipedId(null);
    }
  };

  // ── Swipe handlers ────────────────────────────────────────────────────────
  const onTouchStart = (e: React.TouchEvent, msgId: string) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent, msg: ChatMsg) => {
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    if (dx > 60) {
      // Swipe left → show actions
      setSwipedId(swipedId === msg.id ? null : msg.id);
    } else if (dx < -60) {
      // Swipe right → reply
      setReplyTo(msg);
      setSwipedId(null);
      inputRef.current?.focus();
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    if (e.key === 'Escape') { setReplyTo(null); setSwipedId(null); }
  };

  const myBadge = getBadge(currentUserRole);

  // ── Profile incomplete gate ───────────────────────────────────────────────
  if (!profileComplete) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 20, border: '1px solid rgba(255,193,7,0.25)', backgroundColor: '#0A1628', height: 320, gap: 16, padding: 32, textAlign: 'center' }}>
        <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,193,7,0.1)', border: '2px solid rgba(255,193,7,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>🔒</div>
        <div>
          <p style={{ fontSize: 16, fontWeight: 800, color: 'white', margin: '0 0 8px' }}>Complete Your Profile First</p>
          <p style={{ fontSize: 13, color: '#8FA3BF', lineHeight: 1.7, margin: 0 }}>
            To join the community chat, you need a <strong style={{ color: 'white' }}>profile photo</strong> and <strong style={{ color: 'white' }}>full name</strong> so others can see who you are.
          </p>
        </div>
        <button
          onClick={() => router.push('/beneficiary-dashboard?tab=profile')}
          style={{ padding: '12px 28px', borderRadius: 12, background: 'linear-gradient(to right,#00CEC9,#00B894)', color: '#020C1B', fontWeight: 800, fontSize: 14, border: 'none', cursor: 'pointer', boxShadow: '0 6px 20px rgba(0,206,201,0.3)' }}>
          Complete Profile →
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(0,206,201,0.18)', backgroundColor: '#0A1628', height: 560 }}
      onClick={() => setSwipedId(null)}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes slideIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .msg-row:hover .msg-actions{opacity:1}
      `}</style>

      {/* HEADER */}
      <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'linear-gradient(135deg,rgba(0,206,201,0.07) 0%,rgba(0,184,148,0.05) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: 'linear-gradient(135deg,#00CEC9,#00B894)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MessageCircle style={{ width: 18, height: 18, color: '#020C1B' }} />
          </div>
          <div>
            <p style={{ fontWeight: 800, fontSize: 14, color: 'white', margin: 0 }}>Community Chat</p>
            <p style={{ fontSize: 11, color: '#8FA3BF', margin: 0 }}>{messages.length} messages · {onlineCount} online</p>
          </div>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999, backgroundColor: myBadge.bg, color: myBadge.color, border: `1px solid ${myBadge.border}` }}>
          {myBadge.label}
        </span>
      </div>

      {/* MESSAGES */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading ? (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', flex:1 }}>
            <div style={{ textAlign:'center' }}>
              <div style={{ width:28, height:28, border:'2px solid rgba(0,206,201,0.2)', borderTop:'2px solid #00CEC9', borderRadius:'50%', animation:'spin 1s linear infinite', margin:'0 auto 8px' }} />
              <p style={{ fontSize:12, color:'#8FA3BF', margin:0 }}>Loading messages...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flex:1, gap:10 }}>
            <div style={{ width:52, height:52, borderRadius:'50%', background:'rgba(0,206,201,0.08)', border:'1px solid rgba(0,206,201,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <MessageCircle style={{ width:22, height:22, color:'#00CEC9' }} />
            </div>
            <p style={{ fontSize:14, color:'#8FA3BF', margin:0, fontWeight:600 }}>No messages yet</p>
            <p style={{ fontSize:12, color:'#4A5568', margin:0 }}>Be the first to say hello 👋</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe    = msg.user_id === currentUserId;
            const uData   = msg.users || {} as any;
            const role    = uData.role || 'beneficiary';
            const badge   = getBadge(role);
            const name    = uData.full_name || 'Member';
            const avatar  = uData.profile_picture;
            const prev    = messages[idx - 1];
            const grouped = prev && prev.user_id === msg.user_id &&
              (new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime()) < 120000;
            const repliedMsg = msg.reply_to ? messages.find(m => m.id === msg.reply_to) : null;
            const isSwiped = swipedId === msg.id;

            return (
              <div key={msg.id}
                className="msg-row"
                style={{ display:'flex', flexDirection: isMe ? 'row-reverse' : 'row', gap:8, alignItems:'flex-end', animation:'slideIn 0.2s ease', position:'relative' }}
                onTouchStart={e => onTouchStart(e, msg.id)}
                onTouchEnd={e => onTouchEnd(e, msg)}>

                {/* Avatar */}
                {!grouped ? (
                  <div style={{ flexShrink:0, position:'relative' }}>
                    {avatar ? (
                      <img src={avatar} alt={name} style={{ width:34, height:34, borderRadius:'50%', objectFit:'cover', border:`2px solid ${badge.border}` }} />
                    ) : (
                      <div style={{ width:34, height:34, borderRadius:'50%', backgroundColor:badge.bg, border:`2px solid ${badge.border}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <span style={{ fontSize:13, fontWeight:800, color:badge.color }}>{name[0]?.toUpperCase()}</span>
                      </div>
                    )}
                    <div style={{ position:'absolute', bottom:-1, right:-1, width:10, height:10, borderRadius:'50%', backgroundColor:badge.color, border:'2px solid #0A1628' }} />
                  </div>
                ) : <div style={{ width:34, flexShrink:0 }} />}

                {/* Bubble area */}
                <div style={{ maxWidth:'72%', display:'flex', flexDirection:'column', gap:3, alignItems: isMe ? 'flex-end' : 'flex-start' }}>

                  {/* Name + badge */}
                  {!grouped && (
                    <div style={{ display:'flex', alignItems:'center', gap:6, flexDirection: isMe ? 'row-reverse' : 'row' }}>
                      <span style={{ fontSize:12, fontWeight:700, color: isMe ? '#00CEC9' : 'white' }}>{isMe ? 'You' : name}</span>
                      <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:999, backgroundColor:badge.bg, color:badge.color, border:`1px solid ${badge.border}` }}>
                        {badge.label}
                      </span>
                    </div>
                  )}

                  {/* Reply preview */}
                  {repliedMsg && (
                    <div style={{ padding:'6px 10px', borderRadius:8, backgroundColor:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderLeft:`3px solid #00CEC9`, maxWidth:'100%' }}>
                      <p style={{ fontSize:11, color:'#00CEC9', fontWeight:700, margin:'0 0 2px' }}>
                        {repliedMsg.user_id === currentUserId ? 'You' : (repliedMsg.users as any)?.full_name || 'Member'}
                      </p>
                      <p style={{ fontSize:11, color:'#8FA3BF', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:200 }}>
                        {repliedMsg.content}
                      </p>
                    </div>
                  )}

                  {/* Message bubble */}
                  {editingMsg?.id === msg.id ? (
                    <div style={{ display:'flex', gap:6, width:'100%' }}>
                      <input
                        autoFocus
                        value={editInput}
                        onChange={e => setEditInput(e.target.value)}
                        onKeyDown={e => { if (e.key==='Enter') submitEdit(); if (e.key==='Escape') setEditingMsg(null); }}
                        maxLength={500}
                        style={{ flex:1, padding:'8px 12px', borderRadius:10, backgroundColor:'#071828', border:'1px solid #00CEC9', color:'white', fontSize:13, outline:'none' }}
                      />
                      <button onClick={submitEdit} style={{ width:32, height:32, borderRadius:8, background:'linear-gradient(135deg,#00CEC9,#00B894)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <Check style={{ width:14, height:14, color:'#020C1B' }} />
                      </button>
                      <button onClick={() => setEditingMsg(null)} style={{ width:32, height:32, borderRadius:8, backgroundColor:'rgba(255,255,255,0.06)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <X style={{ width:14, height:14, color:'#8FA3BF' }} />
                      </button>
                    </div>
                  ) : (
                    <div
                      style={{ padding:'9px 13px', borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px', backgroundColor: isMe ? 'rgba(0,206,201,0.18)' : 'rgba(255,255,255,0.06)', border: isMe ? '1px solid rgba(0,206,201,0.3)' : '1px solid rgba(255,255,255,0.08)', wordBreak:'break-word', cursor:'pointer', transform: isSwiped ? 'translateX(-70px)' : 'translateX(0)', transition:'transform 0.2s ease', position:'relative' }}
                      onClick={e => e.stopPropagation()}>
                      <p style={{ fontSize:14, color: isMe ? '#E0FFFE' : '#E2E8F0', margin:0, lineHeight:1.5 }}>{msg.content}</p>
                    </div>
                  )}

                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    <span style={{ fontSize:10, color:'#4A5568' }}>{timeAgo(msg.created_at)}</span>
                    {msg.edited && <span style={{ fontSize:10, color:'#4A5568', fontStyle:'italic' }}>(edited)</span>}
                  </div>
                </div>

                {/* Action buttons — shown on hover (desktop) or swipe (mobile) */}
                <div className="msg-actions" style={{ display:'flex', flexDirection: isMe ? 'row-reverse' : 'row', gap:4, alignItems:'center', opacity: isSwiped ? 1 : 0, transition:'opacity 0.15s', flexShrink:0 }}>
                  {/* Reply */}
                  <button
                    onClick={e => { e.stopPropagation(); setReplyTo(msg); setSwipedId(null); inputRef.current?.focus(); }}
                    title="Reply"
                    style={{ width:28, height:28, borderRadius:8, backgroundColor:'rgba(0,206,201,0.1)', border:'1px solid rgba(0,206,201,0.2)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Reply style={{ width:13, height:13, color:'#00CEC9' }} />
                  </button>

                  {/* Edit (own messages only) */}
                  {isMe && (
                    <button
                      onClick={e => { e.stopPropagation(); setEditingMsg(msg); setEditInput(msg.content); setSwipedId(null); }}
                      title="Edit"
                      style={{ width:28, height:28, borderRadius:8, backgroundColor:'rgba(255,193,7,0.1)', border:'1px solid rgba(255,193,7,0.2)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <Pencil style={{ width:13, height:13, color:'#ffc107' }} />
                    </button>
                  )}

                  {/* Delete (own messages only) */}
                  {isMe && (
                    <button
                      onClick={e => { e.stopPropagation(); deleteMessage(msg.id); }}
                      title="Delete"
                      style={{ width:28, height:28, borderRadius:8, backgroundColor:'rgba(255,107,107,0.1)', border:'1px solid rgba(255,107,107,0.2)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <Trash2 style={{ width:13, height:13, color:'#ff6b6b' }} />
                    </button>
                  )}

                  {/* Report (others' messages only) */}
                  {!isMe && (
                    <button
                      onClick={e => { e.stopPropagation(); reportMessage(msg.id); }}
                      title={reported.has(msg.id) ? 'Reported' : 'Report'}
                      style={{ width:28, height:28, borderRadius:8, backgroundColor: reported.has(msg.id) ? 'rgba(255,107,107,0.2)' : 'rgba(255,255,255,0.05)', border:'1px solid rgba(255,107,107,0.2)', cursor: reported.has(msg.id) ? 'default' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <Flag style={{ width:13, height:13, color: reported.has(msg.id) ? '#ff6b6b' : '#4A5568' }} />
                    </button>
                  )}
                </div>

                {/* Swipe action bar (mobile) */}
                {isSwiped && (
                  <div style={{ position:'absolute', right: isMe ? 'auto' : 0, left: isMe ? 0 : 'auto', top:0, bottom:0, display:'flex', gap:4, alignItems:'center', padding:'0 6px', backgroundColor:'#0A1628', borderRadius:12 }}
                    onClick={e => e.stopPropagation()}>
                    <button onClick={() => { setReplyTo(msg); setSwipedId(null); inputRef.current?.focus(); }} style={{ width:36, height:36, borderRadius:10, backgroundColor:'rgba(0,206,201,0.15)', border:'1px solid rgba(0,206,201,0.3)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <Reply style={{ width:15, height:15, color:'#00CEC9' }} />
                    </button>
                    {isMe && <>
                      <button onClick={() => { setEditingMsg(msg); setEditInput(msg.content); setSwipedId(null); }} style={{ width:36, height:36, borderRadius:10, backgroundColor:'rgba(255,193,7,0.12)', border:'1px solid rgba(255,193,7,0.3)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <Pencil style={{ width:15, height:15, color:'#ffc107' }} />
                      </button>
                      <button onClick={() => deleteMessage(msg.id)} style={{ width:36, height:36, borderRadius:10, backgroundColor:'rgba(255,107,107,0.12)', border:'1px solid rgba(255,107,107,0.3)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <Trash2 style={{ width:15, height:15, color:'#ff6b6b' }} />
                      </button>
                    </>}
                    {!isMe && (
                      <button onClick={() => reportMessage(msg.id)} style={{ width:36, height:36, borderRadius:10, backgroundColor: reported.has(msg.id) ? 'rgba(255,107,107,0.2)' : 'rgba(255,255,255,0.05)', border:'1px solid rgba(255,107,107,0.25)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <Flag style={{ width:15, height:15, color: reported.has(msg.id) ? '#ff6b6b' : '#8FA3BF' }} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* REPLY BANNER */}
      {replyTo && (
        <div style={{ padding:'8px 14px', backgroundColor:'rgba(0,206,201,0.06)', borderTop:'1px solid rgba(0,206,201,0.15)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:3, height:32, backgroundColor:'#00CEC9', borderRadius:2, flexShrink:0 }} />
            <div>
              <p style={{ fontSize:11, color:'#00CEC9', fontWeight:700, margin:0 }}>
                Replying to {replyTo.user_id === currentUserId ? 'yourself' : (replyTo.users as any)?.full_name || 'Member'}
              </p>
              <p style={{ fontSize:11, color:'#8FA3BF', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:260 }}>
                {replyTo.content}
              </p>
            </div>
          </div>
          <button onClick={() => setReplyTo(null)} style={{ width:24, height:24, borderRadius:'50%', backgroundColor:'rgba(255,255,255,0.06)', border:'none', color:'#8FA3BF', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <X style={{ width:12, height:12 }} />
          </button>
        </div>
      )}

      {/* INPUT */}
      <div style={{ padding:'12px 14px', borderTop:'1px solid rgba(255,255,255,0.07)', background:'rgba(255,255,255,0.02)', flexShrink:0 }}>
        {sendError && (
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8, padding:'8px 12px', borderRadius:10, backgroundColor:'rgba(255,193,7,0.08)', border:'1px solid rgba(255,193,7,0.2)' }}>
            <p style={{ fontSize:12, color:'#ffc107', margin:0, flex:1 }}>{sendError}</p>
            {sendError.includes('profile') && (
              <button onClick={() => router.push('/beneficiary-dashboard?tab=profile')}
                style={{ fontSize:11, fontWeight:700, color:'#020C1B', background:'linear-gradient(to right,#00CEC9,#00B894)', border:'none', borderRadius:7, padding:'4px 10px', cursor:'pointer', whiteSpace:'nowrap' }}>
                Update Profile
              </button>
            )}
          </div>
        )}
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <div style={{ flexShrink:0 }}>
            {currentUserAvatar ? (
              <img src={currentUserAvatar} alt="me" style={{ width:32, height:32, borderRadius:'50%', objectFit:'cover', border:`2px solid ${myBadge.border}` }} />
            ) : (
              <div style={{ width:32, height:32, borderRadius:'50%', backgroundColor:myBadge.bg, border:`2px solid ${myBadge.border}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <span style={{ fontSize:13, fontWeight:800, color:myBadge.color }}>{(currentUserName||'U')[0].toUpperCase()}</span>
              </div>
            )}
          </div>
          <input
            ref={inputRef}
            value={input}
            onChange={e => { setInput(e.target.value); if(sendError) setSendError(''); }}
            onKeyDown={handleKey}
            placeholder="Write a message... (Enter to send, ← swipe to reply)"
            maxLength={500}
            disabled={sending}
            style={{ flex:1, padding:'10px 14px', borderRadius:12, backgroundColor:'#071828', border:'1px solid rgba(0,206,201,0.2)', color:'white', fontSize:14, outline:'none', caretColor:'#00CEC9', opacity:sending?0.7:1 }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            style={{ width:42, height:42, borderRadius:12, background: input.trim()&&!sending ? 'linear-gradient(135deg,#00CEC9,#00B894)' : 'rgba(0,206,201,0.1)', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor: input.trim()&&!sending ? 'pointer' : 'not-allowed', flexShrink:0, transition:'all 0.15s' }}>
            {sending
              ? <div style={{ width:14, height:14, border:'2px solid rgba(0,206,201,0.3)', borderTop:'2px solid #00CEC9', borderRadius:'50%', animation:'spin 1s linear infinite' }} />
              : <Send style={{ width:16, height:16, color: input.trim() ? '#020C1B' : '#4A5568' }} />
            }
          </button>
        </div>
        {input.length > 400 && (
          <p style={{ fontSize:10, color: input.length>480 ? '#ff6b6b' : '#8FA3BF', margin:'4px 0 0', textAlign:'right' }}>
            {500 - input.length} characters remaining
          </p>
        )}
      </div>
    </div>
  );
}