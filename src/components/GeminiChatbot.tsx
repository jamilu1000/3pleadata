import React, { useState, useRef, useEffect } from 'react';
import { Language } from '../types';
import { translations } from '../i18n/translations';
import { MessageSquare, X, Send, Sparkles, Loader2, Globe, Bot, User, ChevronDown } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{ title: string; uri: string }>;
  timestamp: string;
}

interface GeminiChatbotProps {
  language: Language;
}

export const GeminiChatbot: React.FC<GeminiChatbotProps> = ({ language }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_welcome',
      role: 'assistant',
      content:
        language === 'en'
          ? 'Salam! Welcome to 3PLE A Multi-Services. I am your AI financial and travel consultant grounded in real-time Google Search data. How may I assist you with VTU, KEDCO electricity bills, BUK school fees, or Kano flight bookings today?'
          : 'Sannu da zuwa 3PLE A! Ni ne mataimakinku na fasahar AI mai amfani da bayanan Google kai tsaye. Ta yaya zan iya taimaka muku game da katin waya, kudin wutar KEDCO, kudin makarantar BUK, ko tikitin jirgin sama a Kano?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const starterQuestions = [
    language === 'en' ? 'What are current KEDCO electricity tariffs in Kano?' : 'Nawa ne kudin wutar KEDCO a Kano a yanzu?',
    language === 'en' ? 'How do I verify BUK school fees invoice?' : 'Ta yaya ake tantance rasitin makarantar BUK?',
    language === 'en' ? 'What is the flight schedule from Kano to Lagos?' : 'Yaushe jirgi ke tashi daga Kano zuwa Legas?',
    language === 'en' ? 'What are wholesale margins for VTU retailers?' : 'Nawa ne ribar dillalai akan katin MTN da Airtel?',
  ];

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!messageText) setInput('');
    setIsLoading(true);

    try {
      // Build conversation history payload
      const history = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/v1/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to get response.');
      }

      const botMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        sources: data.sources || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: `Error: ${err.message || 'Could not connect to Gemini service.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 px-4 py-3 bg-slate-900 hover:bg-emerald-800 text-white rounded-full shadow-2xl transition-all hover:scale-105 border border-slate-700 focus:outline-none"
        title="Chat with 3PLE A Gemini Assistant"
      >
        <div className="relative">
          <Sparkles className="w-5 h-5 text-emerald-400" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
        </div>
        <span className="text-xs font-bold tracking-wide">
          {language === 'en' ? 'AI Assistant' : 'Mataimakin AI'}
        </span>
      </button>

      {/* Slide-over Chatbot Window */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 sm:right-6 z-50 w-[92vw] sm:w-[420px] h-[580px] max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-slate-300 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center text-white">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight">3PLE A Smart AI</h3>
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium">
                  <Globe className="w-3 h-3" />
                  <span>Google Search Grounded · Gemini 3.8</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Conversation Thread */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50 text-xs">
            {messages.map((m) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={m.id}
                  className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-white ${
                      isUser ? 'bg-emerald-700' : 'bg-slate-900'
                    }`}
                  >
                    {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>

                  <div className={`max-w-[78%] space-y-1 ${isUser ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`p-3.5 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                        isUser
                          ? 'bg-emerald-700 text-white rounded-tr-none'
                          : 'bg-white text-slate-800 rounded-tl-none border border-slate-200 shadow-sm'
                      }`}
                    >
                      {m.content}

                      {/* Google Search Grounding Sources */}
                      {m.sources && m.sources.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-1">
                          <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">
                            Verified Web Sources:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {m.sources.map((s, idx) => (
                              <a
                                key={idx}
                                href={s.uri}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors truncate max-w-[180px]"
                              >
                                <Globe className="w-2.5 h-2.5 text-emerald-600" />
                                <span className="truncate">{s.title}</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 block px-1">
                      {m.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center gap-2 text-slate-500 text-xs p-2 bg-white rounded-xl border border-slate-200 w-fit">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                <span>Searching Google & consulting 3PLE A records...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Starter Chips */}
          {messages.length <= 2 && (
            <div className="px-3 py-2 bg-white border-t border-slate-200 flex flex-wrap gap-1.5">
              {starterQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(q)}
                  className="text-[11px] text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-full transition-colors text-left"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={language === 'en' ? 'Ask about tariffs, flights, or fees...' : 'Tambayi kudin wuta ko na makaranta...'}
              className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="p-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl transition-colors disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
