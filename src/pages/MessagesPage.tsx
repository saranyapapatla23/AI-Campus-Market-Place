import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MessageCircle,
  Send,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Message, User as UserType } from '@/types';

export default function MessagesPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState<
    (Message & { otherUser: UserType })[]
  >([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [otherUser, setOtherUser] = useState<UserType | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Get initial user from URL params if provided
  const initialUserId = searchParams.get('user');

  useEffect(() => {
    if (user) {
      loadConversations();
      if (initialUserId) {
        startNewConversation(initialUserId);
      }
    }
  }, [user, initialUserId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat);
      // Subscribe to new messages
      const channel = supabase
        .channel(`messages:${user?.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
          },
          (payload) => {
            const msg = payload.new as Message;
            if (
              (msg.sender_id === selectedChat || msg.receiver_id === selectedChat) &&
              (msg.sender_id === user?.id || msg.receiver_id === user?.id)
            ) {
              setMessages((prev) => [...prev, msg]);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedChat, user?.id]);

  const loadConversations = async () => {
    setLoading(true);
    const { data: messages } = await supabase
      .from('messages')
      .select('*, sender:users!messages_sender_id_fkey(*), receiver:users!messages_receiver_id_fkey(*)')
      .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`)
      .order('created_at', { ascending: false });

    if (messages) {
      // Group by conversation
      const convMap = new Map<string, any>();
      messages.forEach((msg) => {
        const otherId = msg.sender_id === user?.id ? msg.receiver_id : msg.sender_id;
        if (!convMap.has(otherId)) {
          const otherUser = msg.sender_id === user?.id ? msg.receiver : msg.sender;
          convMap.set(otherId, { ...msg, otherUser });
        }
      });
      setConversations(Array.from(convMap.values()));
    }
    setLoading(false);
  };

  const startNewConversation = async (userId: string) => {
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    if (userData) {
      setOtherUser(userData);
      setSelectedChat(userId);
      setMessages([]);
    }
  };

  const loadMessages = async (otherId: string) => {
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', otherId)
      .single();
    setOtherUser(userData);

    const { data: msgs } = await supabase
      .from('messages')
      .select('*, sender:users(*), receiver:users(*)')
      .or(`and(sender_id.eq.${user?.id},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${user?.id})`)
      .order('created_at', { ascending: true });
    setMessages(msgs || []);

    // Mark as read
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('receiver_id', user?.id)
      .eq('sender_id', otherId)
      .eq('is_read', false);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !user || sending) return;

    setSending(true);
    const { data } = await supabase
      .from('messages')
      .insert({
        sender_id: user.id,
        receiver_id: selectedChat,
        content: newMessage.trim(),
      })
      .select('*, sender:users(*), receiver:users(*)')
      .single();

    if (data) {
      setMessages((prev) => [...prev, data]);
      setNewMessage('');
      loadConversations();
    }
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date: string) => {
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      <div className="container max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Messages</h1>

        <div className="grid lg:grid-cols-[300px,1fr] gap-4">
          {/* Conversations List */}
          <Card className="h-[calc(100vh-200px)]">
            <CardHeader className="border-b">
              <div className="relative">
                <Input placeholder="Search conversations..." className="pl-10" />
              </div>
            </CardHeader>
            <ScrollArea className="h-[calc(100%-60px)]">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground text-sm">No conversations yet</p>
                </div>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.otherUser.id}
                    onClick={() => setSelectedChat(conv.otherUser.id)}
                    className={cn(
                      'w-full p-4 flex items-center gap-3 hover:bg-muted transition-colors border-b',
                      selectedChat === conv.otherUser.id && 'bg-muted'
                    )}
                  >
                    <Avatar>
                      <AvatarImage src={conv.otherUser.avatar_url} />
                      <AvatarFallback>
                        {conv.otherUser.full_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-sm truncate">
                        {conv.otherUser.full_name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {conv.content}
                      </p>
                    </div>
                    {conv.is_read === false && conv.sender_id !== user?.id && (
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                    )}
                  </button>
                ))
              )}
            </ScrollArea>
          </Card>

          {/* Chat Area */}
          <Card className="h-[calc(100vh-200px)] flex flex-col">
            {selectedChat && otherUser ? (
              <>
                {/* Chat Header */}
                <CardHeader className="border-b py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden"
                        onClick={() => setSelectedChat(null)}
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                      <Link to={`/user/${otherUser.id}`}>
                        <Avatar>
                          <AvatarImage src={otherUser.avatar_url} />
                          <AvatarFallback>{otherUser.full_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                      </Link>
                      <div>
                        <p className="font-medium">{otherUser.full_name}</p>
                        <p className="text-xs text-muted-foreground">{otherUser.college_name}</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                {/* Messages */}
                <ScrollArea ref={scrollRef} className="flex-1 p-4">
                  <AnimatePresence initial={false}>
                    {messages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          'flex mb-4',
                          msg.sender_id === user?.id ? 'justify-end' : 'justify-start'
                        )}
                      >
                        <div
                          className={cn(
                            'max-w-[70%] rounded-2xl px-4 py-2',
                            msg.sender_id === user?.id
                              ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-br-md'
                              : 'bg-muted rounded-bl-md'
                          )}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <p
                            className={cn(
                              'text-xs mt-1',
                              msg.sender_id === user?.id ? 'text-white/70' : 'text-muted-foreground'
                            )}
                          >
                            {formatTime(msg.created_at)}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </ScrollArea>

                {/* Input */}
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="flex-1"
                      disabled={sending}
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || sending}
                      className="bg-gradient-to-r from-blue-500 to-cyan-500"
                    >
                      {sending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">
                    {conversations.length > 0
                      ? 'Select a conversation to start chatting'
                      : 'Start a conversation by contacting a seller'}
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
