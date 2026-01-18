'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, User, Bot, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export default function AICoach() {
    const { token } = useAuthStore();
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

        const userMessage: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        // OFFLINE MODE MOCK
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));

            const mockResponse: Message = {
                role: 'assistant',
                content: "I am operating in Offline Mode. I can see you said: \"" + input + "\", but I cannot process complex queries without the backend."
            };

            setMessages(prev => [...prev, mockResponse]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: "Something went wrong in the simulation." }]);
        } finally {
            setIsLoading(false);
        }
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
                        initial={{ opacity: 0, y: 100, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 100, scale: 0.9 }}
                        className="fixed bottom-8 right-8 w-full max-w-sm h-[600px] bg-white rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col border border-slate-200"
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
                                <div
                                    key={idx}
                                    className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-brand-light text-brand-dark'
                                        }`}>
                                        {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                                    </div>
                                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.role === 'user'
                                        ? 'bg-indigo-600 text-white rounded-tr-none'
                                        : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none shadow-sm'
                                        }`}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-brand-light text-brand-dark flex items-center justify-center">
                                        <Bot size={14} />
                                    </div>
                                    <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-slate-100">
                                        <Loader2 size={16} className="animate-spin text-slate-400" />
                                    </div>
                                </div>
                            )}
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
