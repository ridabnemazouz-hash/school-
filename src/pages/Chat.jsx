import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../components/ui/Card';
import { Search, Send, Paperclip, Image, MoreVertical, Loader, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import API from '../config';

export function Chat() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    fetchContacts();
  }, []);

  useEffect(() => {
    if (activeContact) {
      fetchMessages(activeContact.id);
      const interval = setInterval(() => fetchMessages(activeContact.id), 3000);
      return () => clearInterval(interval);
    }
  }, [activeContact]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchContacts = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/chat/contacts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setContacts(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (contactId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/chat/messages/${contactId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeContact) return;

    setSending(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/chat/send`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receiver_id: activeContact.id,
          content: newMessage
        })
      });
      if (res.ok) {
        setNewMessage('');
        fetchMessages(activeContact.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const roleColors = {
    'Super Admin': 'bg-purple-100 text-purple-600',
    'Admin': 'bg-blue-100 text-blue-600',
    'Teacher': 'bg-emerald-100 text-emerald-600',
    'Student': 'bg-mauve-100 text-mauve-600',
    'Parent': 'bg-amber-100 text-amber-600',
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      {/* Contacts Sidebar */}
      <div className="w-80 border-r border-slate-100 flex flex-col bg-slate-50/50">
        <div className="p-6 border-b border-slate-100 bg-white">
          <h2 className="font-bold text-slate-900 text-lg mb-4">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-500 transition-all"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loading ? (
            <div className="flex items-center justify-center p-10 text-slate-400"><Loader className="animate-spin mr-2" size={18}/> Loading...</div>
          ) : filteredContacts.length === 0 ? (
            <div className="p-10 text-center text-slate-400 text-sm">No contacts found</div>
          ) : filteredContacts.map((contact) => (
            <div 
              key={contact.id} 
              onClick={() => setActiveContact(contact)}
              className={`p-3 flex items-center gap-3 cursor-pointer rounded-xl transition-all ${
                activeContact?.id === contact.id ? 'bg-mauve-500 text-white shadow-lg' : 'hover:bg-white text-slate-600'
              }`}
            >
              <div className="relative shrink-0">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${activeContact?.id === contact.id ? 'bg-white/20' : (roleColors[contact.role] || 'bg-slate-100 text-slate-600')}`}>
                  {contact.name.charAt(0)}
                </div>
                {contact.online && <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 rounded-full shadow-sm ${activeContact?.id === contact.id ? 'border-mauve-500' : 'border-slate-50'}`}></div>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                  <h4 className={`text-sm font-semibold truncate ${activeContact?.id === contact.id ? 'text-white' : 'text-slate-800'}`}>{contact.name}</h4>
                </div>
                <p className={`text-[10px] font-semibold uppercase tracking-wide ${activeContact?.id === contact.id ? 'text-mauve-100' : 'text-slate-400'}`}>{contact.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      {activeContact ? (
        <div className="flex-1 flex flex-col bg-white">
          <div className="h-16 border-b border-slate-100 px-6 flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${roleColors[activeContact.role] || 'bg-slate-100 text-slate-600'}`}>
                {activeContact.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">{activeContact.name}</h3>
                <p className="text-xs text-green-500">Online</p>
              </div>
            </div>
            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
              <MoreVertical size={18} />
            </button>
          </div>

          <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/30">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <MessageSquare size={48} className="mb-4 opacity-50" />
                <p className="text-sm font-medium">No messages yet. Say hello!</p>
              </div>
            ) : messages.map((msg) => {
              const isMine = user && msg.sender_id === user.id;
              return (
                <div key={msg.id} className={`flex gap-2 max-w-[75%] ${isMine ? 'ml-auto flex-row-reverse' : ''}`}>
                  <div className={`p-3 rounded-2xl shadow-sm ${
                    isMine 
                      ? 'bg-mauve-500 text-white rounded-br-none shadow-mauve-100' 
                      : 'bg-white border border-slate-100 text-slate-700 rounded-bl-none shadow-slate-100'
                  }`}>
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                    <span className={`text-[10px] font-medium mt-1 block ${
                      isMine ? 'text-mauve-200' : 'text-slate-400'
                    }`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={scrollRef} />
          </div>

          <div className="p-4 border-t border-slate-100 bg-white">
            <form onSubmit={handleSend} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-mauve-500/20 focus-within:border-mauve-500 transition-all">
              <button type="button" className="text-slate-400 hover:text-mauve-500 transition-colors p-1"><Paperclip size={18} /></button>
              <input 
                type="text" 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..." 
                className="flex-1 bg-transparent border-none focus:outline-none text-sm px-2 text-slate-700"
              />
              <button 
                type="submit" 
                disabled={!newMessage.trim() || sending}
                className="bg-mauve-500 text-white p-2 rounded-lg hover:bg-mauve-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {sending ? <Loader className="animate-spin" size={18} /> : <Send size={18} />}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center bg-slate-50/50 text-slate-400">
          <div className="p-8 bg-white rounded-full shadow-xl mb-6">
            <MessageSquare size={56} className="text-mauve-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">Select a conversation</h3>
          <p className="text-sm mt-2">Pick someone from the list to start chatting.</p>
        </div>
      )}
    </div>
  );
}
