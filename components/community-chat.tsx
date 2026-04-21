'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase-client';
import { Send, MessageCircle } from 'lucide-react';

// ── Role badge config ─────────────────────────────────────────────────────────
const ROLE_BADGE: Record<string, { label: string; color: string; bg: string; border: string }> = {
  admin:          { label: 'Admin',          color: '#9B59B6', bg: 'rgba(155,89,182,0.18)', border: 'rgba(155,89,182,0.4)' },
  philanthropist: { label: 'Philanthropist', color: '#00B894', bg: 'rgba(0,184,148,0.15)',  border: 'rgba(0,184,148,0.4)'  },
  beneficiary:    { label: 'Beneficiary',    color: '#00CEC9', bg: 'rgba(0,206,201,0.12)',  border: 'rgba(0,206,201,0.35)' },
};

function getBadge(role: string) {
  return ROLE_BADGE[role] || ROLE_BADGE.beneficiary;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

interface ChatMessage {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  users: { full_name: string; profile_picture: string | null; role: string } | null;
}

interface CommunityChatProps {
  currentUserId: string;
  currentUserRole: string;
  currentUserName: string;
  currentUserAvatar?: string;
}

export function CommunityChat({
  currentUserId, currentUserRole, currentUserName, currentUserAvatar,
}: CommunityChatProps) {
  const [messages,    setMessages]    = useState<ChatMessage[]>([]);
  const [input,       setInput]       = useState('');
  const [loading,     setLoading]     = useState(true);
  const [sending,     setSending]     = useState(false);
  const [sendError,   setSendError]   = useState('');
  const [onlineCount, setOnlineCount] = useState(1);
  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);

  // ── Load messages ─────────────────────────────────────────────────────────
  const loadMessages = useCallback(async () => {
    const { data, error } = await supabase
      .from('community_messages')
      .select('id, user_id, content, created_at, users:user_id(full_name, profile_picture, role)')
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) console.error('[chat] load error:', error);
    setMessages((data as any) || []);
    setLoading(false);
  }, []);

  // ── Realtime subscription ─────────────────────────────────────────────────
  useEffect(() => {
    loadMessages();

    const channel = supabase
      .channel('community-chat-v2')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'community_messages' },
        async (payload) => {
          // Fetch the full row with user details
          const { data } = await supabase
            .from('community_messages')
            .select('id, user_id, content, created_at, users:user_id(full_name, profile_picture, role)')
            .eq('id', payload.new.id)
            .single();
          if (data) {
            setMessages(prev => {
              if (prev.find(m => m.id === (data as any).id)) return prev;
              return [...prev, data as any];
            });
          }
        }
      )
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setOnlineCount(Math.max(1, Object.keys(state).length));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: currentUserId });
        }
      });

    return () => { supabase.removeChannel(channel); };
  }, [currentUserId, loadMessages]);

  // ── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Send via API route (bypasses RLS issue with custom JWT) ───────────────
  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending) return;

    setSending(true);
    setSendError('');
    setInput(''); // clear immediately for snappy UX

    try {
      const res = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId, content: text }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        // Restore input on failure
        setInput(text);
        setSendError(data.error || 'Failed to send. Try again.');
      }
    } catch {
      setInput(text);
      setSendError('Network error. Please try again.');
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const myBadge = getBadge(currentUserRole);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(0,206,201,0.18)', backgroundColor: '#0A1628', height: 520 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* HEADER */}
      <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'linear-gradient(135deg,rgba(0,206,201,0.07) 0%,rgba(0,184,148,0.05) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: 'linear-gradient(135deg,#00CEC9,#00B894)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MessageCircle style={{ width: 18, height: 18, color: '#020C1B' }} />
          </div>
          <div>
            <p style={{ fontWeight: 800, fontSize: 14, color: 'white', margin: 0 }}>Community Chat</p>
            <p style={{ fontSize: 11, color: '#8FA3BF', margin: 0 }}>
              {messages.length} message{messages.length !== 1 ? 's' : ''} · {onlineCount} online
            </p>
          </div>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999, backgroundColor: myBadge.bg, color: myBadge.color, border: `1px solid ${myBadge.border}` }}>
          {myBadge.label}
        </span>
      </div>

      {/* MESSAGES */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 28, height: 28, border: '2px solid rgba(0,206,201,0.2)', borderTop: '2px solid #00CEC9', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 8px' }} />
              <p style={{ fontSize: 12, color: '#8FA3BF', margin: 0 }}>Loading messages...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 10 }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(0,206,201,0.08)', border: '1px solid rgba(0,206,201,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageCircle style={{ width: 22, height: 22, color: '#00CEC9' }} />
            </div>
            <p style={{ fontSize: 14, color: '#8FA3BF', margin: 0, fontWeight: 600 }}>No messages yet</p>
            <p style={{ fontSize: 12, color: '#4A5568', margin: 0 }}>Be the first to say hello 👋</p>
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

            return (
              <div key={msg.id} style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', gap: 8, alignItems: 'flex-end' }}>
                {/* Avatar */}
                {!grouped ? (
                  <div style={{ flexShrink: 0, position: 'relative' }}>
                    {avatar ? (
                      <img src={avatar} alt={name} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${badge.border}` }} />
                    ) : (
                      <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: badge.bg, border: `2px solid ${badge.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: badge.color }}>{name[0]?.toUpperCase()}</span>
                      </div>
                    )}
                    <div style={{ position: 'absolute', bottom: -1, right: -1, width: 10, height: 10, borderRadius: '50%', backgroundColor: badge.color, border: '2px solid #0A1628' }} />
                  </div>
                ) : (
                  <div style={{ width: 32, flexShrink: 0 }} />
                )}

                {/* Bubble */}
                <div style={{ maxWidth: '72%', display: 'flex', flexDirection: 'column', gap: 3, alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                  {!grouped && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexDirection: isMe ? 'row-reverse' : 'row' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: isMe ? '#00CEC9' : 'white' }}>{isMe ? 'You' : name}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999, backgroundColor: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
                        {badge.label}
                      </span>
                    </div>
                  )}
                  <div style={{ padding: '9px 13px', borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px', backgroundColor: isMe ? 'rgba(0,206,201,0.18)' : 'rgba(255,255,255,0.06)', border: isMe ? '1px solid rgba(0,206,201,0.3)' : '1px solid rgba(255,255,255,0.08)', wordBreak: 'break-word' }}>
                    <p style={{ fontSize: 14, color: isMe ? '#E0FFFE' : '#E2E8F0', margin: 0, lineHeight: 1.5 }}>{msg.content}</p>
                  </div>
                  <span style={{ fontSize: 10, color: '#4A5568' }}>{timeAgo(msg.created_at)}</span>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)', flexShrink: 0 }}>
        {sendError && (
          <p style={{ fontSize: 11, color: '#ff6b6b', margin: '0 0 6px', paddingLeft: 4 }}>{sendError}</p>
        )}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* My avatar */}
          <div style={{ flexShrink: 0 }}>
            {currentUserAvatar ? (
              <img src={currentUserAvatar} alt="me" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${myBadge.border}` }} />
            ) : (
              <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: myBadge.bg, border: `2px solid ${myBadge.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: myBadge.color }}>{(currentUserName || 'U')[0].toUpperCase()}</span>
              </div>
            )}
          </div>

          <input
            ref={inputRef}
            value={input}
            onChange={e => { setInput(e.target.value); if (sendError) setSendError(''); }}
            onKeyDown={handleKey}
            placeholder="Write a message... (Enter to send)"
            maxLength={500}
            disabled={sending}
            style={{ flex: 1, padding: '10px 14px', borderRadius: 12, backgroundColor: '#071828', border: '1px solid rgba(0,206,201,0.2)', color: 'white', fontSize: 14, outline: 'none', caretColor: '#00CEC9', opacity: sending ? 0.7 : 1 }}
          />

          <button
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            style={{ width: 42, height: 42, borderRadius: 12, background: input.trim() && !sending ? 'linear-gradient(135deg,#00CEC9,#00B894)' : 'rgba(0,206,201,0.1)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: input.trim() && !sending ? 'pointer' : 'not-allowed', flexShrink: 0, transition: 'all 0.15s' }}>
            {sending
              ? <div style={{ width: 14, height: 14, border: '2px solid rgba(0,206,201,0.3)', borderTop: '2px solid #00CEC9', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              : <Send style={{ width: 16, height: 16, color: input.trim() ? '#020C1B' : '#4A5568' }} />
            }
          </button>
        </div>
        {input.length > 400 && (
          <p style={{ fontSize: 10, color: input.length > 480 ? '#ff6b6b' : '#8FA3BF', margin: '4px 0 0', textAlign: 'right' }}>
            {500 - input.length} characters remaining
          </p>
        )}
      </div>
    </div>
  );
}