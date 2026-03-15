'use client';

import { useState } from 'react';
import { Bot, MessageCircle, Send, X } from 'lucide-react';
import { aiAPI, getErrorMessage } from '@/lib/api';

interface Msg {
  role: 'user' | 'assistant';
  text: string;
}

export function MemberChatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'assistant', text: 'Hi! I can help with workouts, plans, appointments, and gym usage at PowerWorld Kiribathgoda.' },
  ]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', text }]);
    setLoading(true);
    try {
      const res = await aiAPI.chat(text);
      setMessages((m) => [...m, { role: 'assistant', text: res.answer }]);
    } catch (err) {
      setMessages((m) => [...m, { role: 'assistant', text: `I could not answer right now: ${getErrorMessage(err)}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <div className="w-[340px] h-[460px] mb-3 rounded-2xl border border-zinc-700 bg-zinc-900/95 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
            <p className="text-white text-sm font-semibold flex items-center gap-2"><Bot size={15} className="text-red-400" /> Member Assistant</p>
            <button onClick={() => setOpen(false)} className="text-zinc-400 hover:text-white"><X size={16} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`text-sm p-2.5 rounded-xl ${m.role === 'assistant' ? 'bg-zinc-800 text-zinc-200' : 'bg-red-600/20 text-white ml-6'}`}>
                {m.text}
              </div>
            ))}
            {loading && <div className="text-xs text-zinc-500">Assistant is typing...</div>}
          </div>
          <div className="p-3 border-t border-zinc-800 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
              placeholder="Ask about your training, plan, or schedule..."
              className="flex-1 bg-zinc-800 text-white border border-zinc-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-500"
            />
            <button onClick={send} disabled={loading} className="px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white disabled:opacity-60">
              <Send size={15} />
            </button>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-xl flex items-center justify-center"
        aria-label="Open member assistant"
      >
        {open ? <X size={18} /> : <MessageCircle size={18} />}
      </button>
    </div>
  );
}

