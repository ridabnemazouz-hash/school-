import React from 'react';
import { Card } from '../components/ui/Card';
import { Search, Send, Paperclip, Image, MoreVertical } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Chat() {
  const { user } = useAuth();
  
  return (
    <div className="h-[calc(100vh-8rem)] flex bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Contacts Sidebar */}
      <div className="w-80 border-r border-slate-200 flex flex-col bg-slate-50/50">
        <div className="p-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-800 text-lg mb-4">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search conversations..." 
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-mauve-500"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {[
            { name: 'Mr. Hassan (Math)', role: 'Teacher', msg: 'Don\'t forget tomorrow\'s exam.', time: '10:30 AM', unread: 2, online: true },
            { name: 'Administration', role: 'Admin', msg: 'Your payment was received.', time: 'Yesterday', unread: 0, online: false },
            { name: 'Youssef B.', role: 'Student', msg: 'Thanks for the notes!', time: 'Monday', unread: 0, online: true },
          ].map((contact, i) => (
            <div key={i} className={`p-4 flex items-center gap-3 cursor-pointer transition-colors border-b border-slate-100 ${i === 0 ? 'bg-mauve-50' : 'hover:bg-slate-100'}`}>
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-slate-200 flex-shrink-0" />
                {contact.online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                  <h4 className="text-sm font-semibold text-slate-800 truncate">{contact.name}</h4>
                  <span className="text-[10px] text-slate-500">{contact.time}</span>
                </div>
                <p className="text-xs text-slate-500 truncate">{contact.msg}</p>
              </div>
              {contact.unread > 0 && (
                <div className="w-5 h-5 rounded-full bg-mauve-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {contact.unread}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        <div className="h-16 border-b border-slate-200 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-200" />
            <div>
              <h3 className="font-semibold text-slate-800">Mr. Hassan (Math)</h3>
              <p className="text-xs text-green-500">Online</p>
            </div>
          </div>
          <button className="text-slate-400 hover:text-slate-600">
            <MoreVertical size={20} />
          </button>
        </div>

        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/30">
          <div className="text-center">
            <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full">Today</span>
          </div>
          
          <div className="flex gap-3 max-w-[80%]">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0 mt-auto" />
            <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-bl-sm shadow-sm">
              <p className="text-sm text-slate-700">Hello! Just a reminder that tomorrow we have the chapter 3 exam.</p>
              <span className="text-[10px] text-slate-400 mt-1 block">10:25 AM</span>
            </div>
          </div>

          <div className="flex gap-3 max-w-[80%] ml-auto justify-end">
            <div className="bg-mauve-600 text-white p-3 rounded-2xl rounded-br-sm shadow-sm">
              <p className="text-sm">Thank you sir, I am reviewing the PDF you sent.</p>
              <span className="text-[10px] text-mauve-200 mt-1 block text-right">10:30 AM</span>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 bg-white">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full px-4 py-2">
            <button className="text-slate-400 hover:text-slate-600 p-1">
              <Paperclip size={18} />
            </button>
            <button className="text-slate-400 hover:text-slate-600 p-1">
              <Image size={18} />
            </button>
            <input 
              type="text" 
              placeholder="Type your message..." 
              className="flex-1 bg-transparent border-none focus:outline-none text-sm px-2"
            />
            <button className="bg-mauve-600 text-white p-2 rounded-full hover:bg-mauve-700 transition-colors">
              <Send size={16} className="ml-0.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
