  import { useTranslation } from 'react-i18next';
  import { useState, useEffect, useRef } from 'react';
  import { motion, AnimatePresence } from 'framer-motion';
  import { MessageCircle, X, Send, ChevronDown } from 'lucide-react';
  import { useSelector } from 'react-redux';
  import { selectUser } from '@/features/auth/authSlice';
  import { chatApi } from '@/services/chatApi';
  import { formatRelative } from '@/utils/formatters';
  import { cn } from '@/utils/cn';
  import toast from 'react-hot-toast';

  export const ChatWidget = ({ hotel }) => {
    const { t } = useTranslation();
    const user = useSelector(selectUser);
    const [open,  setOpen]  = useState(false);
    const [convId, setConvId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [text,  setText]  = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [unread,  setUnread]  = useState(0);
    const bottomRef = useRef(null);

    if (!user || !hotel?._id) return null;

    const ensureConversation = async () => {
      if (convId) return convId;
      try {
        const { data } = await chatApi.startConversation(hotel._id, { subject: t('chat.inquiry') + ' ' + hotel.name });
        const id = data.data.conversation._id;
        setConvId(id);
        return id;
      } catch { toast.error('Could not start chat'); return null; }
    };

    const loadMessages = async (id) => {
      try {
        setLoading(true);
        const { data } = await chatApi.getMessages(id, { limit: 30 });
        setMessages(data.data || []);
        chatApi.markAsRead(id).catch(() => {});
        setUnread(0);
      } catch {} finally { setLoading(false); }
    };

    const handleOpen = async () => {
      setOpen(true);
      const id = await ensureConversation();
      if (id) loadMessages(id);
    };

    const handleSend = async (e) => {
      e.preventDefault();
      if (!text.trim()) return;
      setSending(true);
      const id = convId || await ensureConversation();
      if (!id) { setSending(false); return; }
      try {
        const { data } = await chatApi.sendMessage(id, { text: text.trim() });
        setMessages(p => [...p, data.data.message]);
        setText('');
      } catch { toast.error('Failed to send'); }
      finally { setSending(false); }
    };

    useEffect(() => {
      if (open) setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }, [messages, open]);

    return (
      <div className="fixed bottom-6 right-6 z-40">
        <AnimatePresence>
          {open && (
            <motion.div initial={{ opacity:0, scale:0.95, y:10 }} animate={{ opacity:1, scale:1, y:0 }}
              exit={{ opacity:0, scale:0.95, y:10 }} transition={{ type:'spring', damping:25, stiffness:300 }}
              className="mb-4 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-neutral-100 flex flex-col overflow-hidden"
              style={{ height: '480px' }}>
              {/* header */}
              <div className="flex items-center gap-3 p-4 bg-amber-500 text-white flex-shrink-0">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
                  {hotel.name?.[0]}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm leading-none">{hotel.name}</p>
                  <p className="text-white/80 text-xs mt-0.5">Chat with our team</p>
                </div>
                <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
                  <ChevronDown className="w-5 h-5" />
                </button>
              </div>

              {/* messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-50 scrollbar-none">
                {!convId && !loading && (
                  <div className="text-center py-8">
                    <MessageCircle className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
                    <p className="text-sm text-neutral-400">Send a message to start chatting</p>
                  </div>
                )}
                {loading && <div className="flex justify-center py-6"><div className="w-6 h-6 border-2 border-neutral-200 border-t-amber-500 rounded-full animate-spin" /></div>}
                {messages.map(msg => {
                  const isMe = msg.senderId?._id === user._id || msg.senderId === user._id;
                  return (
                    <div key={msg._id} className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
                      <div className={cn('max-w-[78%] px-3.5 py-2 rounded-2xl text-sm',
                        isMe ? 'bg-amber-500 text-white rounded-br-sm' : 'bg-white border border-neutral-100 text-neutral-700 rounded-bl-sm shadow-sm')}>
                        <p>{msg.text}</p>
                        <p className={cn('text-[10px] mt-1', isMe ? 'text-white/70' : 'text-neutral-400')}>
                          {formatRelative(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* input */}
              <form onSubmit={handleSend} className="p-3 border-t border-neutral-100 flex gap-2 bg-white flex-shrink-0">
                <input value={text} onChange={e => setText(e.target.value)}
                  placeholder={t('chat.typeMessage')}
                  className="flex-1 px-3 py-2 text-sm rounded-xl border border-neutral-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition-all" />
                <button type="submit" disabled={!text.trim() || sending}
                  className="w-9 h-9 rounded-xl bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center transition-all disabled:opacity-50 flex-shrink-0">
                  {sending ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* FAB */}
        <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
          onClick={open ? () => setOpen(false) : handleOpen}
          className="w-14 h-14 rounded-full bg-amber-500 hover:bg-amber-600 text-white shadow-xl flex items-center justify-center transition-colors relative">
          <AnimatePresence mode="wait">
            {open
              ? <motion.div key="x"  initial={{ rotate:-90, opacity:0 }} animate={{ rotate:0, opacity:1 }} exit={{ rotate:90, opacity:0 }}><X className="w-6 h-6" /></motion.div>
              : <motion.div key="msg" initial={{ rotate:90,  opacity:0 }} animate={{ rotate:0, opacity:1 }} exit={{ rotate:-90, opacity:0 }}><MessageCircle className="w-6 h-6" /></motion.div>}
          </AnimatePresence>
          {unread > 0 && !open && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
              {unread}
            </span>
          )}
        </motion.button>
      </div>
    );
  };
