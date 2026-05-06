import React, { useState } from 'react';
import { Plug, Zap, MessageSquare, CreditCard, Mail, Globe, Database, Shield, RefreshCw, CheckCircle2, XCircle, Settings2, Power } from 'lucide-react';
import { motion } from 'framer-motion';

const INTEGRATIONS = [
  { id: 'stripe', name: 'Stripe Payments', icon: CreditCard, color: 'text-indigo-400', desc: 'Secure school fees and payments', status: 'active' },
  { id: 'smtp', name: 'Email (SMTP)', icon: Mail, color: 'text-blue-400', desc: 'System notifications and reports', status: 'active' },
  { id: 'sms', name: 'SMS Gateway', icon: MessageSquare, color: 'text-emerald-400', desc: 'Parent alerts and urgent news', status: 'inactive' },
  { id: 'twilio', name: 'Twilio', icon: Globe, color: 'text-red-400', desc: 'Video rooms and voice calls', status: 'active' },
  { id: 'sendgrid', name: 'SendGrid', icon: Zap, color: 'text-amber-400', desc: 'Transactional email automation', status: 'inactive' },
  { id: 'aws', name: 'AWS S3', icon: Database, color: 'text-orange-400', desc: 'Storage for documents and files', status: 'active' },
];

export function IntegrationsHub() {
  const [loading, setLoading] = useState(false);

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 shadow-lg shadow-indigo-500/5">
            <Plug className="text-indigo-400" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Integrations Hub</h1>
            <p className="text-sm text-slate-500 font-medium">Connect external services to your platform ecosystem</p>
          </div>
        </div>
        <button onClick={() => setLoading(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 transition-all">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Sync Services
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {INTEGRATIONS.map((app, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            key={app.id} 
            className="group bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-md hover:border-indigo-500/30 transition-all"
          >
            <div className="flex items-start justify-between mb-6">
              <div className={`p-4 rounded-2xl bg-slate-800 border border-slate-700 ${app.color} group-hover:bg-indigo-500/10 group-hover:border-indigo-500/20 transition-all`}>
                <app.icon size={28} />
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                app.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-500 border border-slate-700'
              }`}>
                {app.status === 'active' ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                {app.status}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black text-white">{app.name}</h3>
              <p className="text-sm text-slate-500 font-medium line-clamp-2">{app.desc}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-8">
              <button className="flex items-center justify-center gap-2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-black uppercase tracking-widest rounded-xl border border-slate-700 transition-all">
                <Settings2 size={14} /> Configure
              </button>
              <button className={`flex items-center justify-center gap-2 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                app.status === 'active' ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/20'
              }`}>
                <Power size={14} /> {app.status === 'active' ? 'Disable' : 'Enable'}
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
