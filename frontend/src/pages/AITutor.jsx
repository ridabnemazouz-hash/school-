import React, { useState, useRef, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import API from '../config';
import { Send, Sparkles, BookOpen, Calendar, MessageSquare, Loader2, Lightbulb } from 'lucide-react';

const QUICK_PROMPTS = [
  { icon: BookOpen, label: 'Explain a lesson', prompt: 'Can you help me understand my current lessons?' },
  { icon: Calendar, label: 'Create study plan', prompt: 'Create a study plan for this week' },
  { icon: Lightbulb, label: 'Help with homework', prompt: 'I need help with my homework. Can you guide me?' },
  { icon: MessageSquare, label: 'Ask a question', prompt: 'I have a question about my studies.' },
];

export function AITutor() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('chat'); // chat or study-plan
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text = input) => {
    if (!text.trim() || loading) return;

    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
            const endpoint = mode === 'study-plan' ? '/ai-tutor/study-plan' : '/ai-tutor/chat';
      const res = await fetch(`${API}${endpoint}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
      }
    } catch (err) {
      console.error('AI chat error:', err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Please check your internet and try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = (content) => {
    const parts = content.split(/(```[\s\S]*?```|\*\*.*?\*\*|\*.*?\*|\n)/g);
    return parts.map((part, i) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const code = part.slice(3, -3);
        return (
          <pre key={i} className="bg-slate-800 text-green-400 p-3 rounded-lg text-xs overflow-x-auto my-2 font-mono">
            <code>{code}</code>
          </pre>
        );
      }
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-slate-800">{part.slice(2, -2)}</strong>;
      }
      if (part === '\n') return <br key={i} />;
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="text-indigo-600" size={28} />
            AI Tutor
          </h1>
          <p className="text-slate-500 mt-1">Ask questions about your lessons, get study plans, and homework help.</p>
        </div>
        <div className="flex gap-2 bg-white p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setMode('chat')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              mode === 'chat' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <MessageSquare size={14} className="inline mr-1" /> Chat
          </button>
          <button
            onClick={() => setMode('study-plan')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              mode === 'study-plan' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Calendar size={14} className="inline mr-1" /> Study Plan
          </button>
        </div>
      </div>

      <Card className="flex-1 overflow-hidden flex flex-col p-0 border-0 shadow-xl shadow-slate-200/50">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-3xl bg-indigo-50 flex items-center justify-center mb-6">
                <Sparkles size={40} className="text-indigo-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Marhaba, {user.name}!</h2>
              <p className="text-slate-500 max-w-md mb-8">
                I'm your AI tutor. I can help you understand lessons, create study plans, and guide you through homework.
              </p>
              <div className="grid grid-cols-2 gap-3 max-w-lg">
                {QUICK_PROMPTS.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(p.prompt)}
                    className="flex items-center gap-3 p-4 bg-white border border-slate-100 rounded-xl hover:border-indigo-200 hover:shadow-md transition-all text-left group"
                  >
                    <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 group-hover:bg-indigo-100 transition-colors">
                      <p.icon size={18} />
                    </div>
                    <span className="text-sm font-semibold text-slate-700">{p.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-sm'
                  : 'bg-slate-50 text-slate-700 rounded-2xl rounded-tl-sm'
              } px-5 py-3 shadow-sm`}>
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
                    <Sparkles size={14} className="text-indigo-500" />
                    <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">AI Tutor</span>
                  </div>
                )}
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {msg.role === 'assistant' ? renderMessage(msg.content) : msg.content}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-50 rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <Loader2 size={16} className="text-indigo-500 animate-spin" />
                  <span className="text-sm text-slate-400">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-slate-100 bg-white">
          <form onSubmit={e => { e.preventDefault(); sendMessage(); }} className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={mode === 'study-plan' ? "Tell me about your subjects and I'll create a plan..." : "Ask me anything about your studies..."}
              className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-slate-50"
              disabled={loading}
            />
            <Button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 px-5 py-3"
              disabled={loading || !input.trim()}
            >
              <Send size={18} />
            </Button>
          </form>
          <p className="text-[10px] text-slate-300 mt-2 text-center">AI can make mistakes. Verify important information.</p>
        </div>
      </Card>
    </div>
  );
}
