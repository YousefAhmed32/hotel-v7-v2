import { useTranslation } from 'react-i18next';
import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import { Send, MessageSquare, Circle, Search, X as XIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { selectUserHotelId, selectUser } from '@/features/auth/authSlice';
import { cn } from '@/utils/cn';
import { formatRelative } from '@/utils/formatters';
import api from '@/services/api';
import toast from 'react-hot-toast';

/* ─── Brand ─── */
const BRAND = '#f6a003';
const BRAND_LIGHT = '#fff7e6';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export default function ChatPage() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const hotelId = useSelector(selectUserHotelId);
  const user    = useSelector(selectUser);
  const token   = localStorage.getItem('accessToken');
  const socketRef = useRef(null);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  const [conversations, setConversations] = useState([]);
  const [active,        setActive]        = useState(null);
  const [messages,      setMessages]      = useState([]);
  const [text,          setText]          = useState('');
  const [loading,       setLoading]       = useState(false);
  const [msgLoading,    setMsgLoading]    = useState(false);
  const [search,        setSearch]        = useState('');

  /* Socket */
  useEffect(() => {
    if (!token) return;
    const socket = io(SOCKET_URL, { auth: { token }, transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('message:new', (msg) => {
      if (msg.conversationId === active?._id) {
        setMessages(p => [...p, msg]);
      }
      setConversations(p => p.map(c => c._id === msg.conversationId
        ? {
            ...c,
            lastMessage: { text: msg.text, sentAt: msg.createdAt },
            unreadStaff: active?._id === c._id ? 0 : (c.unreadStaff || 0) + 1,
          }
        : c
      ));
    });

    socket.on('inbox:new_message', () => loadConversations());
    return () => socket.disconnect();
  }, [token, active?._id]);

  const loadConversations = async () => {
    if (!hotelId) return;
    try {
      setLoading(true);
      const { data } = await api.get(`/hotels/${hotelId}/chat/conversations`, {
        params: { status: 'open', limit: 30 },
      });
      setConversations(data.data || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { loadConversations(); }, [hotelId]);

  const openConversation = async (conv) => {
    setActive(conv);
    setMsgLoading(true);
    try {
      const { data } = await api.get(`/chat/conversations/${conv._id}/messages`, { params: { limit: 50 } });
      setMessages(data.data || []);
      socketRef.current?.emit('conversation:join', { conversationId: conv._id });
      await api.post(`/chat/conversations/${conv._id}/read`);
      setConversations(p => p.map(c => c._id === conv._id ? { ...c, unreadStaff: 0 } : c));
      setTimeout(() => inputRef.current?.focus(), 100);
    } finally { setMsgLoading(false); }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !active) return;
    try {
      socketRef.current?.emit('message:send', { conversationId: active._id, text: text.trim() });
      setText('');
    } catch { toast.error(t('chat.sendFailed')); }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) handleSend(e);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const totalUnread = conversations.reduce((s, c) => s + (c.unreadStaff || 0), 0);

  const filteredConvs = search.trim()
    ? conversations.filter(c =>
        c.guestId?.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.subject?.toLowerCase().includes(search.toLowerCase())
      )
    : conversations;

  return (
    <div className="space-y-6 px-1" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="p-2 rounded-xl" style={{ background: BRAND_LIGHT }}>
              <MessageSquare className="w-5 h-5" style={{ color: BRAND }} />
            </div>
            {totalUnread > 0 && (
              <span className="absolute -top-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center"
                style={{ [isRtl ? 'left' : 'right']: -4 }}>
                {totalUnread > 9 ? '9+' : totalUnread}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">{t('chat.title')}</h1>
            <p className="text-neutral-400 text-sm mt-0.5">{t('chat.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-neutral-200 to-transparent" />

      {/* Chat layout */}
      <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden shadow-sm flex h-[620px]">

        {/* ── Sidebar ── */}
        <div className={cn("flex flex-col flex-shrink-0 border-neutral-100", isRtl ? 'border-l' : 'border-r')} style={{ width: '288px' }}>
          {/* Sidebar header */}
          <div className="p-4 border-b border-neutral-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-neutral-800 text-sm">{t('chat.inbox')}</h3>
              {totalUnread > 0 && (
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: BRAND, color: '#fff' }}
                >
                  {totalUnread} {t('chat.new')}
                </span>
              )}
            </div>
            {/* Search */}
            <div className="relative">
              <Search className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" style={{ [isRtl ? 'right' : 'left']: 12 }} />
              <input
                type="text"
                placeholder={t('chat.searchConvs')}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full py-2 text-xs rounded-xl border border-neutral-200 bg-neutral-50 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                style={{ paddingLeft: isRtl ? 12 : 32, paddingRight: isRtl ? 32 : 12, '--tw-ring-color': BRAND }}
              />
            </div>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto scrollbar-none">
            {loading && (
              <div className="flex justify-center py-8">
                <div className="w-5 h-5 border-2 border-neutral-200 border-t-[#f6a003] rounded-full animate-spin" />
              </div>
            )}
            {!loading && filteredConvs.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-neutral-400 py-12 px-4 text-center">
                <MessageSquare className="w-8 h-8 mb-2 text-neutral-200" />
                <p className="text-xs font-medium">{t('chat.noConvs')}</p>
              </div>
            )}
            {filteredConvs.map(conv => {
              const isActive  = active?._id === conv._id;
              const hasUnread = conv.unreadStaff > 0;
              return (
                <button
                  key={conv._id}
                  onClick={() => openConversation(conv)}
                  className="w-full text-left px-4 py-3.5 border-b border-neutral-50 transition-colors relative"
                  style={isActive
                    ? { background: BRAND_LIGHT, borderLeftColor: BRAND, borderLeftWidth: isRtl ? 0 : 3, borderRightWidth: isRtl ? 3 : 0 }
                    : { borderLeftWidth: isRtl ? 0 : 3, borderRightWidth: isRtl ? 3 : 0, borderLeftColor: 'transparent', borderRightColor: 'transparent' }
                  }
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 text-white"
                      style={{ background: isActive ? BRAND : '#d4d4d4' }}
                    >
                      {conv.guestId?.name?.[0]?.toUpperCase() || 'G'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className={cn('text-sm truncate', hasUnread ? 'font-bold text-neutral-900' : 'font-medium text-neutral-700')}>
                          {conv.guestId?.name || t('common.guest')}
                        </span>
                        {hasUnread && (
                          <span
                            className="w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0"
                            style={{ background: BRAND }}
                          >
                            {conv.unreadStaff}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-400 truncate">{conv.subject}</p>
                      {conv.lastMessage?.text && (
                        <p className="text-xs text-neutral-300 truncate mt-0.5">{conv.lastMessage.text}</p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Message thread ── */}
        <div className="flex-1 flex flex-col min-w-0">
          {active ? (
            <>
              {/* Thread header */}
              <div className="px-5 py-3.5 border-b border-neutral-100 bg-white flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full text-white flex items-center justify-center font-bold text-sm flex-shrink-0"
                  style={{ background: BRAND }}
                >
                  {active.guestId?.name?.[0]?.toUpperCase() || 'G'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-neutral-900">{active.guestId?.name || t('common.guest')}</p>
                  <p className="text-xs text-neutral-400 truncate">{active.subject}</p>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                  <Circle className="w-2 h-2 fill-emerald-500 text-emerald-500" />
                  {t('chat.open')}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-none bg-neutral-50" dir={isRtl ? 'rtl' : 'ltr'}>
                {msgLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-8 h-8 border-2 border-neutral-200 border-t-[#f6a003] rounded-full animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-neutral-400 gap-2">
                    <MessageSquare className="w-10 h-10 text-neutral-200" />
                    <p className="text-sm font-medium">{t('chat.noMessages')}</p>
                    <p className="text-xs text-neutral-300">{t('chat.firstMessage')}</p>
                  </div>
                ) : messages.map(msg => {
                  const isMe = msg.senderId?._id === user?._id || msg.senderId === user?._id;
                  return (
                    <div key={msg._id} className={cn('flex gap-2.5', isMe ? 'justify-end' : 'justify-start')}>
                      {!isMe && (
                        <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-xs font-bold text-neutral-500 flex-shrink-0 self-end">
                          {msg.senderId?.name?.[0] || 'G'}
                        </div>
                      )}
                      <div
                        className={cn(
                          'max-w-xs lg:max-w-sm px-4 py-3 rounded-2xl text-sm leading-relaxed',
                          isMe
                            ? 'text-white rounded-br-sm'
                            : 'bg-white border border-neutral-200 text-neutral-700 rounded-bl-sm shadow-sm'
                        )}
                        style={isMe ? { background: BRAND } : {}}
                      >
                        <p>{msg.text}</p>
                        <p className={cn('text-[10px] mt-1.5', isMe ? 'text-white/60' : 'text-neutral-300')}>
                          {msg.createdAt ? formatRelative(msg.createdAt) : ''}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className="p-4 border-t border-neutral-100 bg-white flex gap-3 items-end" dir={isRtl ? 'rtl' : 'ltr'}>
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t('chat.typePlaceholder')}
                  className="flex-1 resize-none rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all max-h-28"
                  style={{ '--tw-ring-color': BRAND }}
                />
                <button
                  type="submit"
                  disabled={!text.trim()}
                  className="w-10 h-10 rounded-xl text-white flex items-center justify-center transition-all disabled:opacity-40 flex-shrink-0 hover:brightness-95 active:scale-95"
                  style={{ background: BRAND }}
                >
                  <Send className="w-4 h-4" style={{ transform: isRtl ? 'scaleX(-1)' : 'none' }} />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-neutral-50">
              <div className="text-center px-8">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: BRAND_LIGHT }}>
                  <MessageSquare className="w-8 h-8" style={{ color: BRAND }} />
                </div>
                <p className="text-neutral-700 font-bold mb-1">{t('chat.selectConv')}</p>
                <p className="text-sm text-neutral-400">{t('chat.selectDesc')}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}