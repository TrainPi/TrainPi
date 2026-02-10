'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { MessageSquare, X, Send, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { chatAPI } from '@/lib/api';
import { getMockChatResponse } from '@/lib/chatMockResponses';
import { MOCK_ONLY } from '@/lib/mockConfig';
import toast from 'react-hot-toast';
import ChatMessageBubble, { ChatLoadingBubble } from '@/components/ui/ChatMessageBubble';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export default function AICoach() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: "Hi! I'm your AI Coach. How can I help you with your roadmap today? 🚀" }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg = input.trim();
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setInput('');
        setIsLoading(true);

        if (MOCK_ONLY) {
            await new Promise(r => setTimeout(r, 600));
            setMessages(prev => [...prev, { role: 'assistant', content: getMockChatResponse(userMsg) }]);
        } else {
            try {
                const data = await chatAPI.sendMessage(userMsg);
                setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
                if (data.response?.includes('All AI quota is temporarily used')) {
                    toast.error('AI at capacity. Try again later or buy credits.', { duration: 5000 });
                }
            } catch (error: any) {
                if (error?.code === 'INSUFFICIENT_CREDITS' || error?.message === 'INSUFFICIENT_CREDITS') {
                    setMessages(prev => [...prev, { role: 'assistant', content: "You're out of credits. Buy more at Dashboard → Manage Credits to keep chatting." }]);
                    toast.error('Out of credits. Buy more to continue.', { duration: 4000 });
                } else {
                    setMessages(prev => [...prev, { role: 'assistant', content: getMockChatResponse(userMsg) }]);
                }
            }
        }
        setIsLoading(false);
    };

    return (
        <>
            {/* Floating Action Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(true)}
                className={`fixed bottom-8 right-8 p-4 bg-brand-DEFAULT text-white rounded-full shadow-2xl hover:bg-brand-dark transition-colors z-40 ${isOpen ? 'hidden' : 'block'}`}
            >
                <div className="relative">
                    <MessageSquare size={28} />
                    <span className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full border-2 border-white" />
                </div>
            </motion.button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        className="fixed top-8 right-8 w-full max-w-sm h-[600px] bg-white rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col border border-slate-200"
                    >
                        {/* Header */}
                        <div className="p-4 bg-brand-DEFAULT text-white flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-white/20 rounded-lg">
                                    <Bot size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold">AI Coach</h3>
                                    <p className="text-xs text-brand-light/80">Always here to help</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                            {messages.map((msg, idx) => (
                                <ChatMessageBubble key={idx} role={msg.role} content={msg.content} showIcon={msg.role === 'assistant'} />
                            ))}
                            {isLoading && <ChatLoadingBubble />}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-4 bg-white border-t border-slate-100">
                            <form onSubmit={handleSend} className="relative">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask about your career..."
                                    className="w-full pl-4 pr-12 py-3 bg-slate-50 border-0 rounded-xl focus:ring-2 focus:ring-brand-DEFAULT/20 focus:outline-none transition-all placeholder:text-slate-400"
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || isLoading}
                                    className="absolute right-2 top-2 p-1.5 bg-brand-DEFAULT text-white rounded-lg hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Send size={16} />
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
