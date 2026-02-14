'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/lib/store';
import { inbox as inboxApi } from '@/lib/api';
import Navbar from '@/components/layout/Navbar';
import {
    PaperAirplaneIcon,
    ArchiveBoxIcon,
    FunnelIcon,
    FaceSmileIcon,
    PaperClipIcon,
    ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

export default function InboxPage() {
    const { user, isAuthenticated } = useAuthStore();
    const [conversations, setConversations] = useState<any[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [replyChannel, setReplyChannel] = useState('email');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadConversations();
    }, [isAuthenticated]);

    useEffect(() => {
        if (selectedConversation) {
            loadMessages(selectedConversation.id);
        }
    }, [selectedConversation]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadConversations = async () => {
        try {
            setLoading(true);
            const res = await inboxApi.getConversations();
            setConversations(res.data);
            if (res.data.length > 0 && !selectedConversation) {
                setSelectedConversation(res.data[0]);
            }
        } catch (e) {
            console.error('Failed to load conversations');
        } finally {
            setLoading(false);
        }
    };

    const loadMessages = async (id: string) => {
        try {
            setMessagesLoading(true);
            const res = await inboxApi.getMessages(id);
            setMessages(res.data.messages);
        } catch (e) {
            console.error('Failed to load messages');
        } finally {
            setMessagesLoading(false);
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConversation) return;

        try {
            const res = await inboxApi.sendMessage(selectedConversation.id, {
                content: newMessage,
                channel: replyChannel
            });
            setMessages([...messages, res.data]);
            setNewMessage('');
            // Refresh conversation list to show last message
            loadConversations();
        } catch (e) {
            alert('Failed to send message');
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="spinner"></div></div>;

    return (
        <div className="flex bg-gray-50 min-h-screen">
            <Navbar />

            <main className="flex-1 ml-64 h-screen flex flex-col">
                {/* Inbox Header */}
                <div className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-800">Inbox</h1>
                    <div className="flex gap-2">
                        <button className="btn btn-secondary flex items-center gap-2">
                            <FunnelIcon className="w-5 h-5" /> Filter
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Conversation List */}
                    <div className="w-96 border-r border-gray-200 bg-white overflow-y-auto">
                        {conversations.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">No conversations yet</div>
                        ) : (
                            conversations.map((conv) => (
                                <div
                                    key={conv.id}
                                    onClick={() => setSelectedConversation(conv)}
                                    className={`p-4 border-b border-gray-50 cursor-pointer transition-colors hover:bg-gray-50 ${selectedConversation?.id === conv.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="font-bold text-gray-900">{conv.contacts?.name || 'Unknown Contact'}</h3>
                                        <span className="text-[10px] text-gray-400">
                                            {conv.last_message_at ? format(new Date(conv.last_message_at), 'HH:mm') : ''}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 truncate">
                                        {conv.unread_count > 0 && <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mr-2"></span>}
                                        {conv.last_message_content || 'New conversation'}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Chat Window */}
                    <div className="flex-1 flex flex-col bg-gray-50">
                        {selectedConversation ? (
                            <>
                                {/* Chat Header */}
                                <div className="bg-white p-4 border-b border-gray-200 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                            {selectedConversation.contacts?.name?.charAt(0)}
                                        </div>
                                        <div>
                                            <h2 className="font-bold text-gray-900">{selectedConversation.contacts?.name}</h2>
                                            <p className="text-xs text-gray-500">{selectedConversation.contacts?.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="p-2 text-gray-400 hover:text-gray-600"><ArchiveBoxIcon className="w-6 h-6" /></button>
                                    </div>
                                </div>

                                {/* Message History */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                    {messagesLoading ? (
                                        <div className="flex justify-center py-12"><div className="spinner"></div></div>
                                    ) : messages.length === 0 ? (
                                        <div className="text-center py-12 text-gray-400">No messages in this conversation</div>
                                    ) : (
                                        messages.map((msg, i) => (
                                            <div
                                                key={msg.id || i}
                                                className={`flex ${msg.sender_type === 'staff' ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div className={`max-w-[70%] rounded-2xl p-4 ${msg.sender_type === 'staff'
                                                    ? 'bg-blue-600 text-white rounded-tr-none'
                                                    : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-none'
                                                    }`}>
                                                    <p className="text-sm leading-relaxed">{msg.content}</p>
                                                    <p className={`text-[10px] mt-2 ${msg.sender_type === 'staff' ? 'text-blue-100' : 'text-gray-400'}`}>
                                                        {format(new Date(msg.created_at), 'HH:mm')} via {msg.channel}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Reply Form */}
                                <div className="p-6 bg-white border-t border-gray-200">
                                    <form onSubmit={handleSend} className="max-w-4xl mx-auto">
                                        <div className="flex items-center gap-4 mb-4">
                                            <select
                                                className="text-xs border rounded px-2 py-1 bg-gray-50 text-gray-600"
                                                value={replyChannel}
                                                onChange={(e) => setReplyChannel(e.target.value)}
                                            >
                                                <option value="email">Reply via Email</option>
                                                <option value="sms">Reply via SMS</option>
                                            </select>
                                            <div className="h-4 w-px bg-gray-200"></div>
                                            <span className="text-xs text-gray-400">Automation paused while reply is active</span>
                                        </div>

                                        <div className="relative">
                                            <textarea
                                                rows={3}
                                                className="input resize-none pr-24"
                                                placeholder="Type your message..."
                                                value={newMessage}
                                                onChange={(e) => setNewMessage(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                        e.preventDefault();
                                                        handleSend(e);
                                                    }
                                                }}
                                            />
                                            <div className="absolute right-2 bottom-2 flex items-center gap-2">
                                                <button type="button" className="p-2 text-gray-400 hover:text-gray-600"><FaceSmileIcon className="w-5 h-5" /></button>
                                                <button type="button" className="p-2 text-gray-400 hover:text-gray-600"><PaperClipIcon className="w-5 h-5" /></button>
                                                <button
                                                    type="submit"
                                                    disabled={!newMessage.trim()}
                                                    className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md shadow-blue-100"
                                                >
                                                    <PaperAirplaneIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                                <ChatBubbleLeftRightIcon className="w-16 h-16 mb-4 opacity-20" />
                                <p>Select a conversation to start messaging</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
