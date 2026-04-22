'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase-client';
import { Send, MessageCircle, Reply, Pencil, Trash2, Flag, X, Check, Heart, Bell, BellOff, AtSign } from 'lucide-react';
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
  mentions: string[] | null;
  users: { full_name: string; profile_picture: string | null; role: string } | null;
}

interface Notif {
  id: string;
  type: 'like' | 'reply' | 'mention';
  actor_id: string;
  message_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  actor?: { full_name: string; profile_picture: string | null };
}

interface ChatUser {
  id: string;
  full_name: string;
  profile_picture: string | null;
  role: string;
}

interface Props {
  currentUserId: string;
  currentUserRole: string;
  currentUserName: string;
  currentUserAvatar?: string;
  profileComplete: boolean;
  onGoToProfile?: () => void;
}

export function CommunityChat({ currentUserId, currentUserRole, currentUserName, currentUserAvatar, profileComplete, onGoToProfile }: Props) {
  const router = useRouter();
  const [messages,      setMessages]      = useState<ChatMsg[]>([]);
  const [input,         setInput]         = useState('');
  const [loading,       setLoading]       = useState(true);
  const [sending,       setSending]       = useState(false);
  const [sendError,     setSendError]     = useState('');
  const [replyTo,       setReplyTo]       = useState<ChatMsg | null>(null);
  const [editingMsg,    setEditingMsg]    = useState<ChatMsg | null>(null);
  const [editInput,     setEditInput]     = useState('');
  const [onlineCount,   setOnlineCount]   = useState(1);
  const [reported,      setReported]      = useState<Set<string>>(new Set());
  const [likeCounts,    setLikeCounts]    = useState<Record<string, number>>({});
  const [likedByMe,     setLikedByMe]     = useState<Set<string>>(new Set());
  const [notifications, setNotifications] = useState<Notif[]>([]);
  const [showNotifs,    setShowNotifs]    = useState(false);
  const [allUsers,      setAllUsers]      = useState<ChatUser[]>([]);
  const [mentionQuery,  setMentionQuery]  = useState('');
  const [mentionList,   setMentionList]   = useState<ChatUser[]>([]);
  const [showMentions,  setShowMentions]  = useState(false);
  const [cursorPos,     setCursorPos]     = useState(0);
  const [highlightMsgId,setHighlightMsgId]= useState<string | null>(null);

  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);
  const msgRefs    = useRef<Record<string, HTMLDivElement | null>>({});
  const touchStartX = useRef<number>(0);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // ── Load messages + likes ─────────────────────────────────────────────────
  const loadMessages = useCallback(async () => {
    const { data } = await supabase
      .from('community_messages')
      .select('id, user_id, content, created_at, reply_to, edited, mentions, users:user_id(full_name, profile_picture, role)')
      .order('created_at', { ascending: true })
      .limit(100);
    setMessages((data as any) || []);

    // Load like counts + which ones I liked
    const ids = (data || []).map((m: any) => m.id);
    if (ids.length) {
      const { data: likes } = await supabase
        .from('message_likes').select('message_id, user_id').in('message_id', ids);
      const counts: Record<string, number> = {};
      const myLikes = new Set<string>();
      (likes || []).forEach((l: any) => {
        counts[l.message_id] = (counts[l.message_id] || 0) + 1;
        if (l.user_id === currentUserId) myLikes.add(l.message_id);
      });
      setLikeCounts(counts);
      setLikedByMe(myLikes);
    }
    setLoading(false);
  }, [currentUserId]);

  // ── Load notifications ────────────────────────────────────────────────────
  const loadNotifications = useCallback(async () => {
    const { data } = await supabase
      .from('notifications')
      .select('id, type, actor_id, message_id, content, is_read, created_at, actor:actor_id(full_name, profile_picture)')
      .eq('user_id', currentUserId)
      .order('created_at', { ascending: false })
      .limit(30);
    setNotifications((data as any) || []);
  }, [currentUserId]);

  // ── Load all users for @mention ───────────────────────────────────────────
  const loadAllUsers = useCallback(async () => {
    const { data } = await supabase
      .from('users')
      .select('id, full_name, profile_picture, role')
      .neq('id', currentUserId)
      .limit(200);
    setAllUsers((data as any) || []);
  }, [currentUserId]);

  // ── Realtime ──────────────────────────────────────────────────────────────
  useEffect(() => {
    loadMessages();
    loadNotifications();
    loadAllUsers();

    const channel = supabase.channel('community-chat-v5')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'community_messages' }, async (p) => {
        const { data } = await supabase
          .from('community_messages')
          .select('id, user_id, content, created_at, reply_to, edited, mentions, users:user_id(full_name, profile_picture, role)')
          .eq('id', p.new.id).single();
        if (data) setMessages(prev => prev.find(m => m.id === (data as any).id) ? prev : [...prev, data as any]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'community_messages' }, (p) => {
        setMessages(prev => prev.map(m => m.id === p.new.id ? { ...m, content: p.new.content, edited: p.new.edited } : m));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'community_messages' }, (p) => {
        setMessages(prev => prev.filter(m => m.id !== p.old.id));
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'message_likes' }, (p) => {
        setLikeCounts(prev => ({ ...prev, [p.new.message_id]: (prev[p.new.message_id] || 0) + 1 }));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'message_likes' }, (p) => {
        setLikeCounts(prev => ({ ...prev, [p.old.message_id]: Math.max(0, (prev[p.old.message_id] || 1) - 1) }));
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, async (p) => {
        if (p.new.user_id !== currentUserId) return;
        const { data } = await supabase
          .from('notifications')
          .select('id, type, actor_id, message_id, content, is_read, created_at, actor:actor_id(full_name, profile_picture)')
          .eq('id', p.new.id).single();
        if (data) setNotifications(prev => [data as any, ...prev]);
      })
      .on('presence', { event: 'sync' }, () => {
        setOnlineCount(Math.max(1, Object.keys(channel.presenceState()).length));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') await channel.track({ user_id: currentUserId });
      });

    return () => { supabase.removeChannel(channel); };
  }, [currentUserId, loadMessages, loadNotifications, loadAllUsers]);

  useEffect(() => {
    if (!showNotifs) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, showNotifs]);

  // ── Handle @ mention input ────────────────────────────────────────────────
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const pos = e.target.selectionStart || 0;
    setInput(val);
    setCursorPos(pos);
    setSendError('');

    // Check if cursor is after an @
    const textBefore = val.slice(0, pos);
    const atMatch = textBefore.match(/@(\w*)$/);
    if (atMatch) {
      const q = atMatch[1].toLowerCase();
      setMentionQuery(q);
      const filtered = allUsers.filter(u =>
        u.full_name?.toLowerCase().includes(q) ||
        u.full_name?.toLowerCase().startsWith(q)
      ).slice(0, 6);
      setMentionList(filtered);
      setShowMentions(filtered.length > 0);
    } else {
      setShowMentions(false);
      setMentionQuery('');
    }
  };

  const insertMention = (user: ChatUser) => {
    const textBefore = input.slice(0, cursorPos);
    const textAfter  = input.slice(cursorPos);
    const atIdx = textBefore.lastIndexOf('@');
    const newText = textBefore.slice(0, atIdx) + `@${user.full_name} ` + textAfter;
    setInput(newText);
    setShowMentions(false);
    setMentionQuery('');
    inputRef.current?.focus();
  };

  // Extract mentioned user IDs from message text
  const extractMentions = (text: string): string[] => {
    const names = text.match(/@([\w\s]+?)(?=\s|$|[^\w\s])/g)?.map(m => m.slice(1).trim()) || [];
    return allUsers.filter(u => names.some(n => u.full_name?.toLowerCase() === n.toLowerCase())).map(u => u.id);
  };

  // ── API call ──────────────────────────────────────────────────────────────
  const apiCall = (method: string, body: object) =>
    fetch('/api/chat/message', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json());

  // ── Send ──────────────────────────────────────────────────────────────────
  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true); setSendError(''); setInput(''); setShowMentions(false);
    const mentionIds = extractMentions(text);
    const res = await apiCall('POST', { userId: currentUserId, content: text, replyTo: replyTo?.id || null, mentions: mentionIds });
    if (!res.success) {
      setInput(text);
      setSendError(res.error === 'PROFILE_INCOMPLETE'
        ? `Please complete your profile (${res.field === 'name' ? 'add your name' : 'upload a photo'}) before chatting.`
        : res.error || 'Failed to send.');
    } else {
      setReplyTo(null);
    }
    setSending(false);
    inputRef.current?.focus();
  };

  // ── Like ──────────────────────────────────────────────────────────────────
  const toggleLike = async (msgId: string) => {
    const wasLiked = likedByMe.has(msgId);
    // Optimistic update
    setLikedByMe(prev => { const s = new Set(prev); wasLiked ? s.delete(msgId) : s.add(msgId); return s; });
    setLikeCounts(prev => ({ ...prev, [msgId]: Math.max(0, (prev[msgId] || 0) + (wasLiked ? -1 : 1)) }));
    await apiCall('PUT', { userId: currentUserId, messageId: msgId, action: 'like' });
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
  };

  // ── Report ────────────────────────────────────────────────────────────────
  const reportMessage = async (msgId: string) => {
    if (reported.has(msgId)) return;
    const res = await apiCall('PUT', { userId: currentUserId, messageId: msgId, action: 'report' });
    if (res.success || res.error === 'Already reported') setReported(prev => new Set([...prev, msgId]));
  };

  // ── Mark notifications read + scroll to message ───────────────────────────
  const openNotification = async (notif: Notif) => {
    // Mark read
    await supabase.from('notifications').update({ is_read: true }).eq('id', notif.id);
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
    setShowNotifs(false);

    // Scroll to message
    const el = msgRefs.current[notif.message_id];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightMsgId(notif.message_id);
      setTimeout(() => setHighlightMsgId(null), 2500);
    }
  };

  const markAllRead = async () => {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', currentUserId).eq('is_read', false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (showMentions && (e.key === 'Escape')) { setShowMentions(false); return; }
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    if (e.key === 'Escape') { setReplyTo(null); setEditingMsg(null); setShowMentions(false); }
  };

  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd   = (e: React.TouchEvent, msg: ChatMsg) => {
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    if (dx < -60) { setReplyTo(msg); inputRef.current?.focus(); }
  };

  const myBadge = getBadge(currentUserRole);

  // ── Profile gate ──────────────────────────────────────────────────────────
  if (!profileComplete) {
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', borderRadius:20, border:'1px solid rgba(255,193,7,0.25)', backgroundColor:'#0A1628', height:320, gap:16, padding:32, textAlign:'center' }}>
        <div style={{ width:60, height:60, borderRadius:'50%', background:'rgba(255,193,7,0.1)', border:'2px solid rgba(255,193,7,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28 }}>🔒</div>
        <div>
          <p style={{ fontSize:16, fontWeight:800, color:'white', margin:'0 0 8px' }}>Complete Your Profile First</p>
          <p style={{ fontSize:13, color:'#8FA3BF', lineHeight:1.7, margin:0 }}>You need a <strong style={{ color:'white' }}>profile photo</strong> and <strong style={{ color:'white' }}>full name</strong> to join the chat.</p>
        </div>
        <button onClick={() => onGoToProfile?.()}
          style={{ padding:'12px 28px', borderRadius:12, background:'linear-gradient(to right,#00CEC9,#00B894)', color:'#020C1B', fontWeight:800, fontSize:14, border:'none', cursor:'pointer', boxShadow:'0 6px 20px rgba(0,206,201,0.3)' }}>
          Complete Profile →
        </button>
      </div>
    );
  }

  const notifIcon = (type: string) => type === 'like' ? '❤️' : type === 'reply' ? '↩️' : '👋';

  return (
    <div style={{ display:'flex', flexDirection:'column', borderRadius:20, overflow:'hidden', border:'1px solid rgba(0,206,201,0.18)', backgroundColor:'#0A1628', height:600, position:'relative' }}
      onClick={() => { setShowNotifs(false); setShowMentions(false); }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes slideIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes highlight{0%,100%{background:transparent}50%{background:rgba(0,206,201,0.12)}}
        .action-btn:hover{opacity:1!important;transform:scale(1.08)}
        .action-btn{transition:all 0.15s ease}
        .notif-item:hover{background:rgba(0,206,201,0.06)!important}
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ padding:'12px 16px', borderBottom:'1px solid rgba(255,255,255,0.07)', background:'linear-gradient(135deg,rgba(0,206,201,0.07) 0%,rgba(0,184,148,0.05) 100%)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#00CEC9,#00B894)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <MessageCircle style={{ width:17, height:17, color:'#020C1B' }} />
          </div>
          <div>
            <p style={{ fontWeight:800, fontSize:14, color:'white', margin:0 }}>Community Chat</p>
            <p style={{ fontSize:11, color:'#8FA3BF', margin:0 }}>{messages.length} messages · {onlineCount} online</p>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:11, fontWeight:700, padding:'3px 9px', borderRadius:999, backgroundColor:myBadge.bg, color:myBadge.color, border:`1px solid ${myBadge.border}` }}>
            {myBadge.label}
          </span>
          {/* Notification bell */}
          <button onClick={e => { e.stopPropagation(); setShowNotifs(v => !v); }}
            style={{ position:'relative', width:36, height:36, borderRadius:10, backgroundColor: showNotifs ? 'rgba(0,206,201,0.15)' : 'rgba(255,255,255,0.05)', border:`1px solid ${showNotifs ? 'rgba(0,206,201,0.4)' : 'rgba(255,255,255,0.1)'}`, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Bell style={{ width:16, height:16, color: unreadCount > 0 ? '#00CEC9' : '#8FA3BF' }} />
            {unreadCount > 0 && (
              <span style={{ position:'absolute', top:-5, right:-5, minWidth:18, height:18, borderRadius:999, backgroundColor:'#ff6b6b', color:'white', fontSize:10, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', padding:'0 4px', border:'2px solid #0A1628' }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── NOTIFICATIONS PANEL ── */}
      {showNotifs && (
        <div onClick={e => e.stopPropagation()} style={{ position:'absolute', top:62, right:12, width:320, maxHeight:380, backgroundColor:'#0F1F35', border:'1px solid rgba(0,206,201,0.25)', borderRadius:16, zIndex:100, overflow:'hidden', boxShadow:'0 16px 48px rgba(0,0,0,0.5)', animation:'slideIn 0.15s ease' }}>
          <div style={{ padding:'12px 16px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <p style={{ fontWeight:800, fontSize:13, color:'white', margin:0 }}>Notifications</p>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              {unreadCount > 0 && (
                <button onClick={markAllRead} style={{ fontSize:11, color:'#00CEC9', background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>Mark all read</button>
              )}
              <button onClick={() => setShowNotifs(false)} style={{ width:24, height:24, borderRadius:'50%', backgroundColor:'rgba(255,255,255,0.06)', border:'none', color:'#8FA3BF', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <X style={{ width:12, height:12 }} />
              </button>
            </div>
          </div>
          <div style={{ overflowY:'auto', maxHeight:320 }}>
            {notifications.length === 0 ? (
              <div style={{ padding:'32px 16px', textAlign:'center' }}>
                <BellOff style={{ width:28, height:28, color:'#4A5568', margin:'0 auto 8px' }} />
                <p style={{ fontSize:13, color:'#8FA3BF', margin:0 }}>No notifications yet</p>
              </div>
            ) : notifications.map(n => {
              const actor = (n as any).actor || {};
              return (
                <div key={n.id} className="notif-item"
                  onClick={() => openNotification(n)}
                  style={{ padding:'12px 16px', borderBottom:'1px solid rgba(255,255,255,0.04)', cursor:'pointer', backgroundColor: n.is_read ? 'transparent' : 'rgba(0,206,201,0.04)', display:'flex', gap:10, alignItems:'flex-start' }}>
                  <div style={{ position:'relative', flexShrink:0 }}>
                    {actor.profile_picture ? (
                      <img src={actor.profile_picture} alt="" style={{ width:34, height:34, borderRadius:'50%', objectFit:'cover', border:'2px solid rgba(0,206,201,0.3)' }} />
                    ) : (
                      <div style={{ width:34, height:34, borderRadius:'50%', backgroundColor:'rgba(0,206,201,0.12)', border:'2px solid rgba(0,206,201,0.25)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:800, color:'#00CEC9' }}>
                        {(actor.full_name || '?')[0].toUpperCase()}
                      </div>
                    )}
                    <span style={{ position:'absolute', bottom:-2, right:-2, fontSize:12 }}>{notifIcon(n.type)}</span>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:12, color:'white', margin:'0 0 2px', fontWeight: n.is_read ? 400 : 700 }}>
                      <span style={{ color:'#00CEC9' }}>{actor.full_name || 'Someone'}</span>
                      {n.type === 'like' ? ' liked your message' : n.type === 'reply' ? ' replied to you' : ' mentioned you'}
                    </p>
                    <p style={{ fontSize:11, color:'#8FA3BF', margin:'0 0 3px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      "{n.content}"
                    </p>
                    <p style={{ fontSize:10, color:'#4A5568', margin:0 }}>{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.is_read && <div style={{ width:7, height:7, borderRadius:'50%', backgroundColor:'#00CEC9', flexShrink:0, marginTop:4 }} />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── MESSAGES ── */}
      <div style={{ flex:1, overflowY:'auto', padding:'14px 16px', display:'flex', flexDirection:'column', gap:12 }}>
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
            const isMe       = msg.user_id === currentUserId;
            const uData      = msg.users || {} as any;
            const role       = uData.role || 'beneficiary';
            const badge      = getBadge(role);
            const name       = uData.full_name || 'Member';
            const avatar     = uData.profile_picture;
            const prev       = messages[idx - 1];
            const grouped    = prev && prev.user_id === msg.user_id &&
              (new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime()) < 120000;
            const repliedMsg = msg.reply_to ? messages.find(m => m.id === msg.reply_to) : null;
            const likeCount  = likeCounts[msg.id] || 0;
            const isLiked    = likedByMe.has(msg.id);
            const isHighlighted = highlightMsgId === msg.id;

            // Render content with @mentions highlighted
            const renderContent = (text: string) => {
              const parts = text.split(/(@[\w\s]+?)(?=\s|$|[^\w\s@])/g);
              return parts.map((part, i) => {
                if (part.startsWith('@')) {
                  const mentionedUser = allUsers.find(u => `@${u.full_name}` === part || part === `@${u.full_name}`);
                  return (
                    <span key={i} style={{ color:'#00CEC9', fontWeight:700, background:'rgba(0,206,201,0.12)', borderRadius:4, padding:'0 3px' }}>
                      {part}
                    </span>
                  );
                }
                return <span key={i}>{part}</span>;
              });
            };

            return (
              <div key={msg.id}
                ref={el => { msgRefs.current[msg.id] = el; }}
                style={{ display:'flex', flexDirection: isMe ? 'row-reverse' : 'row', gap:8, alignItems:'flex-start', animation:'slideIn 0.2s ease', borderRadius:12, padding:'2px 4px', transition:'background 0.3s', background: isHighlighted ? 'rgba(0,206,201,0.08)' : 'transparent' }}
                onTouchStart={onTouchStart}
                onTouchEnd={e => onTouchEnd(e, msg)}>

                {/* Avatar */}
                {!grouped ? (
                  <div style={{ flexShrink:0, position:'relative', marginTop:2 }}>
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

                {/* Bubble + actions */}
                <div style={{ maxWidth:'75%', display:'flex', flexDirection:'column', gap:4, alignItems: isMe ? 'flex-end' : 'flex-start' }}>

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
                    <div style={{ padding:'6px 10px', borderRadius:8, backgroundColor:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderLeft:`3px solid #00CEC9` }}>
                      <p style={{ fontSize:11, color:'#00CEC9', fontWeight:700, margin:'0 0 2px' }}>
                        ↩ {repliedMsg.user_id === currentUserId ? 'You' : (repliedMsg.users as any)?.full_name || 'Member'}
                      </p>
                      <p style={{ fontSize:11, color:'#8FA3BF', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:200 }}>
                        {repliedMsg.content}
                      </p>
                    </div>
                  )}

                  {/* Edit mode */}
                  {editingMsg?.id === msg.id ? (
                    <div style={{ display:'flex', gap:6, minWidth:220 }}>
                      <input autoFocus value={editInput} onChange={e => setEditInput(e.target.value)}
                        onKeyDown={e => { if (e.key==='Enter') submitEdit(); if (e.key==='Escape') setEditingMsg(null); }}
                        maxLength={500}
                        style={{ flex:1, padding:'8px 12px', borderRadius:10, backgroundColor:'#071828', border:'1px solid #00CEC9', color:'white', fontSize:13, outline:'none' }} />
                      <button onClick={submitEdit} style={{ width:32, height:32, borderRadius:8, background:'linear-gradient(135deg,#00CEC9,#00B894)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <Check style={{ width:14, height:14, color:'#020C1B' }} />
                      </button>
                      <button onClick={() => setEditingMsg(null)} style={{ width:32, height:32, borderRadius:8, backgroundColor:'rgba(255,255,255,0.06)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <X style={{ width:14, height:14, color:'#8FA3BF' }} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ padding:'10px 14px', borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px', backgroundColor: isMe ? 'rgba(0,206,201,0.18)' : 'rgba(255,255,255,0.06)', border: isMe ? '1px solid rgba(0,206,201,0.3)' : '1px solid rgba(255,255,255,0.08)', wordBreak:'break-word' }}>
                      <p style={{ fontSize:14, color: isMe ? '#E0FFFE' : '#E2E8F0', margin:0, lineHeight:1.55 }}>
                        {renderContent(msg.content)}
                      </p>
                    </div>
                  )}

                  {/* Action row */}
                  {editingMsg?.id !== msg.id && (
                    <div style={{ display:'flex', alignItems:'center', gap:4, flexDirection: isMe ? 'row-reverse' : 'row', flexWrap:'wrap' }}>
                      <span style={{ fontSize:10, color:'#4A5568', marginRight: isMe ? 0 : 4, marginLeft: isMe ? 4 : 0 }}>
                        {timeAgo(msg.created_at)}{msg.edited ? ' · edited' : ''}
                      </span>

                      {/* Like */}
                      <button className="action-btn" onClick={e => { e.stopPropagation(); toggleLike(msg.id); }} title="Like"
                        style={{ display:'flex', alignItems:'center', gap:3, padding:'3px 8px', borderRadius:999, backgroundColor: isLiked ? 'rgba(255,107,107,0.15)' : 'rgba(255,255,255,0.04)', border: isLiked ? '1px solid rgba(255,107,107,0.3)' : '1px solid rgba(255,255,255,0.08)', cursor:'pointer', color: isLiked ? '#ff6b6b' : '#8FA3BF' }}>
                        <Heart style={{ width:11, height:11, fill: isLiked ? '#ff6b6b' : 'none' }} />
                        {likeCount > 0 && <span style={{ fontSize:10, fontWeight:700 }}>{likeCount}</span>}
                      </button>

                      {/* Reply */}
                      <button className="action-btn" onClick={e => { e.stopPropagation(); setReplyTo(msg); inputRef.current?.focus(); }} title="Reply"
                        style={{ display:'flex', alignItems:'center', gap:3, padding:'3px 8px', borderRadius:999, backgroundColor:'rgba(0,206,201,0.06)', border:'1px solid rgba(0,206,201,0.18)', cursor:'pointer', color:'#00CEC9' }}>
                        <Reply style={{ width:11, height:11 }} />
                        <span style={{ fontSize:10, fontWeight:600 }}>Reply</span>
                      </button>

                      {/* Edit (own) */}
                      {isMe && (
                        <button className="action-btn" onClick={e => { e.stopPropagation(); setEditingMsg(msg); setEditInput(msg.content); }} title="Edit"
                          style={{ display:'flex', alignItems:'center', gap:3, padding:'3px 8px', borderRadius:999, backgroundColor:'rgba(255,193,7,0.06)', border:'1px solid rgba(255,193,7,0.18)', cursor:'pointer', color:'#ffc107' }}>
                          <Pencil style={{ width:11, height:11 }} />
                          <span style={{ fontSize:10, fontWeight:600 }}>Edit</span>
                        </button>
                      )}

                      {/* Delete (own) */}
                      {isMe && (
                        <button className="action-btn" onClick={e => { e.stopPropagation(); deleteMessage(msg.id); }} title="Delete"
                          style={{ display:'flex', alignItems:'center', gap:3, padding:'3px 8px', borderRadius:999, backgroundColor:'rgba(255,107,107,0.06)', border:'1px solid rgba(255,107,107,0.18)', cursor:'pointer', color:'#ff6b6b' }}>
                          <Trash2 style={{ width:11, height:11 }} />
                          <span style={{ fontSize:10, fontWeight:600 }}>Delete</span>
                        </button>
                      )}

                      {/* Report (others) */}
                      {!isMe && (
                        <button className="action-btn" onClick={e => { e.stopPropagation(); reportMessage(msg.id); }} title={reported.has(msg.id) ? 'Reported' : 'Report'}
                          style={{ display:'flex', alignItems:'center', gap:3, padding:'3px 8px', borderRadius:999, backgroundColor: reported.has(msg.id) ? 'rgba(255,107,107,0.12)' : 'rgba(255,255,255,0.03)', border:'1px solid rgba(255,107,107,0.2)', cursor: reported.has(msg.id) ? 'default' : 'pointer', color: reported.has(msg.id) ? '#ff6b6b' : '#4A5568' }}>
                          <Flag style={{ width:11, height:11 }} />
                          <span style={{ fontSize:10, fontWeight:600 }}>{reported.has(msg.id) ? 'Reported' : 'Report'}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── REPLY BANNER ── */}
      {replyTo && (
        <div style={{ padding:'8px 14px', backgroundColor:'rgba(0,206,201,0.06)', borderTop:'1px solid rgba(0,206,201,0.15)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:3, height:32, backgroundColor:'#00CEC9', borderRadius:2 }} />
            <div>
              <p style={{ fontSize:11, color:'#00CEC9', fontWeight:700, margin:0 }}>
                ↩ Replying to {replyTo.user_id === currentUserId ? 'yourself' : (replyTo.users as any)?.full_name || 'Member'}
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

      {/* ── @ MENTION DROPDOWN ── */}
      {showMentions && mentionList.length > 0 && (
        <div onClick={e => e.stopPropagation()}
          style={{ position:'absolute', bottom:72, left:14, right:14, backgroundColor:'#0F1F35', border:'1px solid rgba(0,206,201,0.25)', borderRadius:14, overflow:'hidden', zIndex:50, boxShadow:'0 -8px 32px rgba(0,0,0,0.4)', animation:'slideIn 0.15s ease' }}>
          <div style={{ padding:'8px 12px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ fontSize:11, color:'#8FA3BF', margin:0, display:'flex', alignItems:'center', gap:5 }}>
              <AtSign style={{ width:11, height:11 }} /> Mention a member
            </p>
          </div>
          {mentionList.map(u => {
            const b = getBadge(u.role);
            return (
              <div key={u.id} onClick={() => insertMention(u)}
                style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', cursor:'pointer', borderBottom:'1px solid rgba(255,255,255,0.04)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,206,201,0.06)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                {u.profile_picture ? (
                  <img src={u.profile_picture} alt={u.full_name} style={{ width:28, height:28, borderRadius:'50%', objectFit:'cover', border:`2px solid ${b.border}` }} />
                ) : (
                  <div style={{ width:28, height:28, borderRadius:'50%', backgroundColor:b.bg, border:`2px solid ${b.border}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <span style={{ fontSize:11, fontWeight:800, color:b.color }}>{u.full_name[0]?.toUpperCase()}</span>
                  </div>
                )}
                <span style={{ fontSize:13, fontWeight:600, color:'white', flex:1 }}>{u.full_name}</span>
                <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:999, backgroundColor:b.bg, color:b.color, border:`1px solid ${b.border}` }}>{b.label}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* ── INPUT ── */}
      <div style={{ padding:'10px 12px', borderTop:'1px solid rgba(255,255,255,0.07)', background:'rgba(255,255,255,0.02)', flexShrink:0 }}>
        {sendError && (
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8, padding:'8px 12px', borderRadius:10, backgroundColor:'rgba(255,193,7,0.08)', border:'1px solid rgba(255,193,7,0.2)' }}>
            <p style={{ fontSize:12, color:'#ffc107', margin:0, flex:1 }}>{sendError}</p>
            {sendError.includes('profile') && (
              <button onClick={() => onGoToProfile?.()} style={{ fontSize:11, fontWeight:700, color:'#020C1B', background:'linear-gradient(to right,#00CEC9,#00B894)', border:'none', borderRadius:7, padding:'4px 10px', cursor:'pointer', whiteSpace:'nowrap' }}>
                Update Profile
              </button>
            )}
          </div>
        )}
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <div style={{ flexShrink:0 }}>
            {currentUserAvatar ? (
              <img src={currentUserAvatar} alt="me" style={{ width:30, height:30, borderRadius:'50%', objectFit:'cover', border:`2px solid ${myBadge.border}` }} />
            ) : (
              <div style={{ width:30, height:30, borderRadius:'50%', backgroundColor:myBadge.bg, border:`2px solid ${myBadge.border}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <span style={{ fontSize:12, fontWeight:800, color:myBadge.color }}>{(currentUserName||'U')[0].toUpperCase()}</span>
              </div>
            )}
          </div>

          {/* @ button */}
          <button onClick={() => { setInput(p => p + '@'); inputRef.current?.focus(); }}
            style={{ width:32, height:32, borderRadius:9, backgroundColor:'rgba(0,206,201,0.08)', border:'1px solid rgba(0,206,201,0.2)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <AtSign style={{ width:14, height:14, color:'#00CEC9' }} />
          </button>

          <input ref={inputRef} value={input}
            onChange={handleInputChange}
            onKeyDown={handleKey}
            placeholder="Message... (@ to mention, Enter to send)"
            maxLength={500} disabled={sending}
            style={{ flex:1, padding:'9px 13px', borderRadius:12, backgroundColor:'#071828', border:'1px solid rgba(0,206,201,0.2)', color:'white', fontSize:14, outline:'none', caretColor:'#00CEC9', opacity:sending?0.7:1 }} />

          <button onClick={sendMessage} disabled={!input.trim() || sending}
            style={{ width:40, height:40, borderRadius:12, background: input.trim()&&!sending ? 'linear-gradient(135deg,#00CEC9,#00B894)' : 'rgba(0,206,201,0.1)', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor: input.trim()&&!sending ? 'pointer' : 'not-allowed', flexShrink:0, transition:'all 0.15s' }}>
            {sending
              ? <div style={{ width:13, height:13, border:'2px solid rgba(0,206,201,0.3)', borderTop:'2px solid #00CEC9', borderRadius:'50%', animation:'spin 1s linear infinite' }} />
              : <Send style={{ width:15, height:15, color: input.trim() ? '#020C1B' : '#4A5568' }} />
            }
          </button>
        </div>
        {input.length > 400 && (
          <p style={{ fontSize:10, color: input.length>480 ? '#ff6b6b' : '#8FA3BF', margin:'4px 0 0', textAlign:'right' }}>
            {500 - input.length} chars left
          </p>
        )}
      </div>
    </div>
  );
}