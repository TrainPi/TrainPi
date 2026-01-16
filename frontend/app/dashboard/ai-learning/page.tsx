'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { chatAPI } from '@/lib/api';
import { Send, Bot, Sparkles, Mic, Image as ImageIcon, BookOpen, Briefcase, FileText, Target, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSearchParams } from 'next/navigation';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export default function AILearningPage() {
    const { user } = useAuthStore();
    const searchParams = useSearchParams();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const hasInitializedRef = useRef(false);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    // Auto-start chat from URL params
    useEffect(() => {
        const initialQuery = searchParams.get('message');
        if (initialQuery && !hasInitializedRef.current) {
            hasInitializedRef.current = true;
            handleAutoSend(initialQuery);
        }
    }, [searchParams]);

    const handleAutoSend = async (msg: string) => {
        setMessages([{ role: 'user', content: msg }]);
        setIsLoading(true);
        try {
            const data = await chatAPI.sendMessage(msg);
            setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
        } catch (error) {
            console.error('Chat error:', error);
            toast.error('Failed to get response');
        } finally {
            setIsLoading(false);
        }
    };

    const [attachedImage, setAttachedImage] = useState<string | null>(null);
    const [isListening, setIsListening] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAttachedImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleVoiceInput = () => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
            const recognition = new SpeechRecognition();
            recognition.user_recognition = false;
            recognition.lang = 'en-US';
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;

            recognition.onstart = () => setIsListening(true);
            recognition.onend = () => setIsListening(false);
            recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInputMessage(prev => prev + (prev ? ' ' : '') + transcript);
            };

            recognition.start();
        } else {
            toast.error('Voice input is not supported in this browser.');
        }
    };

    const handleSendMessage = async () => {
        if (!inputMessage.trim() && !attachedImage) return;

        const userMsg = inputMessage;
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setInputMessage('');
        const imgToSend = attachedImage;
        setAttachedImage(null); // Clear image after sending
        setIsLoading(true);

        try {
            const data = await chatAPI.sendMessage(userMsg, imgToSend || undefined);
            setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
        } catch (error) {
            console.error('Chat error:', error);
            toast.error('Failed to get response');
        } finally {
            setIsLoading(false);
        }
    };

    // ... existing helper functions ...

    const handleSuggestionClick = (text: string) => {
        setInputMessage(text);
    };

    const suggestions = [
        { icon: Briefcase, label: 'Career Path', prompt: 'Help me find a career path based on my interests.' },
        { icon: BookOpen, label: 'Learning Plan', prompt: 'Create a learning roadmap for Full Stack Development.' },
        { icon: FileText, label: 'Resume Review', prompt: 'How can I improve my resume for a senior role?' },
        { icon: Target, label: 'Interview Prep', prompt: 'Give me a mock interview question for Python.' },
    ];

    return (
        <div className="max-w-4xl mx-auto h-[calc(100vh-4rem)] flex flex-col">
            {/* Header */}
            <div className="text-center mb-8 pt-4">
                <h1 className="text-4xl font-bold gradient-text mb-2">AI Learning</h1>
                {messages.length === 0 && !isLoading && (
                    <div className="flex flex-col items-center mt-12 animate-fade-in">
                        <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-purple-200">
                            <Bot size={40} className="text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">What can I help with?</h2>
                    </div>
                )}
            </div>

            {/* Chat Area */}
            <div className={`flex-1 overflow-y-auto mb-6 space-y-6 px-4 ${messages.length === 0 && !isLoading ? 'hidden' : ''}`}>
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            {/* Avatar */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-indigo-600' : 'bg-purple-600'}`}>
                                {msg.role === 'user' ? (
                                    <span className="text-white text-xs">{user?.full_name?.[0] || 'U'}</span>
                                ) : (
                                    <Bot size={16} className="text-white" />
                                )}
                            </div>

                            {/* Message Bubble */}
                            <div className={`p-4 rounded-2xl shadow-sm overflow-hidden ${msg.role === 'user'
                                ? 'bg-indigo-600 text-white rounded-tr-none'
                                : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
                                }`}>
                                {msg.role === 'assistant' ? (
                                    <MarkdownRenderer content={msg.content} />
                                ) : (
                                    <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start px-4">
                        <div className="flex gap-3">
                            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                                <Bot size={16} className="text-white" />
                            </div>
                            <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-tl-none">
                                <div className="flex gap-1">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Suggestions Grid (Only show when empty) */}
            {messages.length === 0 && !isLoading && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-4 mb-8">
                    {suggestions.map((item, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleSuggestionClick(item.prompt)}
                            className="p-4 bg-white border border-gray-100 rounded-xl hover:shadow-md hover:border-purple-200 transition-all group text-left"
                        >
                            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center mb-3 group-hover:bg-purple-100 transition-colors">
                                <item.icon size={20} className="text-purple-600" />
                            </div>
                            <h3 className="font-semibold text-gray-800 text-sm">{item.label}</h3>
                        </button>
                    ))}
                </div>
            )}

            {/* Input Area */}
            <div className="p-4">
                <div className="relative bg-white p-2 rounded-2xl shadow-lg border border-gray-200 focus-within:ring-2 focus-within:ring-purple-500 transition-all">
                    {attachedImage && (
                        <div className="absolute -top-16 left-0 p-2">
                            <div className="relative">
                                <img src={attachedImage} alt="Preview" className="h-14 w-14 object-cover rounded-lg border border-gray-200" />
                                <button
                                    onClick={() => setAttachedImage(null)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        </div>
                    )}
                    <textarea
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                            }
                        }}
                        placeholder="Ask anything..."
                        className="w-full pl-4 pr-12 py-3 bg-transparent border-none focus:ring-0 resize-none max-h-32 text-gray-800 placeholder-gray-400"
                        rows={1}
                        style={{ minHeight: '50px' }}
                    />

                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                    />

                    {/* Bottom Actions */}
                    <div className="flex items-center justify-between px-2 pb-1">
                        <div className="flex items-center gap-2 text-gray-400">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-indigo-600"
                                title="Upload Image"
                            >
                                <ImageIcon size={20} />
                            </button>
                            <button
                                onClick={handleVoiceInput}
                                className={`p-2 hover:bg-gray-100 rounded-full transition-colors ${isListening ? 'text-red-500 animate-pulse' : 'text-indigo-600'}`}
                                title="Voice Input"
                            >
                                <Mic size={20} />
                            </button>
                        </div>
                        <button
                            onClick={handleSendMessage}
                            disabled={(!inputMessage.trim() && !attachedImage) || isLoading}
                            className={`p-2 rounded-xl transition-all ${inputMessage.trim() || attachedImage
                                ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-md'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            <Send size={20} />
                        </button>
                    </div>
                </div>
                <p className="text-center text-xs text-gray-400 mt-3">
                    AI can make mistakes. Consider verifying important information.
                </p>
            </div>
        </div>
    );
}
