'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bot, MessageCircle, Send, X } from 'lucide-react';
import { aiAPI, getErrorMessage } from '@/lib/api';

interface Msg {
  role: 'user' | 'assistant';
  text: string;
}

type ChatbotRole = 'member' | 'manager';

interface MemberChatbotProps {
  role?: ChatbotRole;
}

type PrefillEventDetail = { message?: string; role?: ChatbotRole };

export function MemberChatbot({ role = 'member' }: MemberChatbotProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);

  const greeting = useMemo(
    () => role === 'manager'
      ? 'Hi! I can help with revenue trends, attendance insights, staffing cues, and operational recommendations for PowerWorld Kiribathgoda.'
      : 'Hi! I can help with workouts, plans, appointments, and gym usage at PowerWorld Kiribathgoda.',
    [role],
  );

  const quickPrompts = useMemo(
    () => role === 'manager'
      ? [
        'Summarize this week’s key risks and actions',
        'What should we do to improve retention this month?',
        'Forecast next month revenue trend from current signals',
      ]
      : [
        'Build a beginner muscle gain plan for me',
        'Explain my current workout plan in simple steps',
        'How do I improve consistency this week?',
      ],
    [role],
  );

  useEffect(() => {
    setMessages([{ role: 'assistant', text: greeting }]);
  }, [greeting]);

  const send = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || loading) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', text }]);
    setLoading(true);
    try {
      const res = await aiAPI.chat(text);
      const answer = (res?.answer ?? '').trim() || 'I could not generate a response. Please try rephrasing your question.';
      setMessages((m) => [...m, { role: 'assistant', text: answer }]);
    } catch (err) {
      setMessages((m) => [...m, { role: 'assistant', text: `I could not answer right now: ${getErrorMessage(err)}` }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading]);

  useEffect(() => {
    const onPrefill = (evt: Event) => {
      const custom = evt as CustomEvent<PrefillEventDetail>;
      if (custom.detail?.role && custom.detail.role !== role) return;
      const msg = (custom.detail?.message ?? '').trim();
      if (!msg) return;
      setOpen(true);
      setInput(msg);
      // Auto-send so user gets an immediate response
      setTimeout(() => send(msg), 100);
    };
    window.addEventListener('pw:ai-chat-prefill', onPrefill as EventListener);
    return () => window.removeEventListener('pw:ai-chat-prefill', onPrefill as EventListener);
  }, [role, send]);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div className="absolute bottom-20 right-0 w-[380px] h-[520px] rounded-3xl border border-zinc-700/80 bg-zinc-900/95 backdrop-blur-2xl shadow-[0_18px_45px_rgba(0,0,0,0.75)] flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-red-600">
                <Bot size={18} className="text-white" />
              </span>
              <div>
                <p className="text-white text-sm font-semibold">{role === 'manager' ? 'Manager Assistant' : 'Member Assistant'}</p>
                <p className="text-[11px] text-zinc-500">PowerWorld Kiribathgoda · AI</p>
              </div>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
              Beta
            </span>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`text-sm px-3 py-2.5 rounded-2xl max-w-[82%] leading-relaxed ${
                m.role === 'assistant'
                  ? 'bg-zinc-800 text-zinc-100 border border-zinc-700/70 shadow-sm'
                  : 'bg-red-600/25 text-zinc-50 ml-auto shadow-sm'
              }`}>
                {m.text}
              </div>
            ))}
            {loading && <div className="text-xs text-zinc-500">Assistant is typing...</div>}
            {!loading && (
              <div className="pt-1 flex flex-wrap gap-2">
                {quickPrompts.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => send(q)}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="px-4 py-3 border-t border-zinc-800 bg-zinc-950/40">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
              placeholder="Ask about your training, plan, or schedule..."
              className="w-full bg-zinc-900 text-white border border-zinc-700 rounded-2xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/70 pr-11"
            />
            <div className="relative -mt-9 flex justify-end pr-1">
              <button
                onClick={() => send()}
                disabled={loading}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-600 hover:bg-red-700 text-white disabled:opacity-60 shadow-md"
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-14 h-14 rounded-full bg-zinc-800/95 hover:bg-zinc-700 text-white shadow-[0_12px_30px_rgba(0,0,0,0.7)] flex items-center justify-center transition-colors duration-150 border border-zinc-700/70"
        aria-label={open ? 'Close member assistant' : 'Open member assistant'}
      >
        {open ? <X size={20} /> : <MessageCircle size={20} />}
      </button>
    </div>
  );
}

