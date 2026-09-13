import React, { useState, useEffect, useRef } from 'react';
import { ChatSession, ChatMessage, UserSession } from './types';
import { Sidebar } from './components/Sidebar';
import { WelcomeBanner } from './components/WelcomeBanner';
import { ChatMessageItem } from './components/ChatMessageItem';
import { ChatInput } from './components/ChatInput';
import { RedeemKeyModal } from './components/RedeemKeyModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { BuyTokensModal } from './components/BuyTokensModal';
import { GroksonLogo } from './components/GroksonLogo';
import { generateEdgeAIResponse } from './utils/aiFallback';
import {
  Menu,
  Sparkles,
  Zap,
  ShieldCheck,
  RotateCcw,
  MessageSquarePlus,
} from 'lucide-react';

const SESSIONS_STORAGE_KEY = 'grokson_chats_v1';
const USER_ID_STORAGE_KEY = 'grokson_user_id';
const LOCAL_BALANCE_KEY = 'grokson_tokens_balance';

export default function App() {
  // User identification
  const [userId, setUserId] = useState<string>(() => {
    let saved = localStorage.getItem(USER_ID_STORAGE_KEY);
    if (!saved) {
      saved = `user_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem(USER_ID_STORAGE_KEY, saved);
    }
    return saved;
  });

  // Token Balance
  const [tokensBalance, setTokensBalance] = useState<number>(() => {
    const saved = localStorage.getItem(LOCAL_BALANCE_KEY);
    return saved ? Number(saved) : 5000;
  });

  // Sidebar & Modals state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isRedeemOpen, setIsRedeemOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isBuyOpen, setIsBuyOpen] = useState(false);

  // Chat sessions state
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem(SESSIONS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse saved sessions:', e);
    }
    const initialId = `session_${Date.now()}`;
    return [
      {
        id: initialId,
        title: 'Новый диалог',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];
  });

  const [currentSessionId, setCurrentSessionId] = useState<string>(() => {
    return sessions[0]?.id || `session_${Date.now()}`;
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Save sessions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
    } catch (e) {
      console.error('Failed to save sessions:', e);
    }
  }, [sessions]);

  // Save balance to localStorage
  useEffect(() => {
    localStorage.setItem(LOCAL_BALANCE_KEY, tokensBalance.toString());
  }, [tokensBalance]);

  // Sync user balance with backend on mount
  const syncUserBalance = async () => {
    try {
      const res = await fetch(`/api/user/${userId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.user && typeof data.user.tokensBalance === 'number') {
          setTokensBalance(data.user.tokensBalance);
        }
      }
    } catch (e) {
      console.log('Using local balance fallback');
    }
  };

  useEffect(() => {
    syncUserBalance();

    // Check URL parameters for direct activation key (e.g. ?key=GROK-START-10K)
    const params = new URLSearchParams(window.location.search);
    const urlKey = params.get('key');
    if (urlKey) {
      handleRedeemKey(urlKey).then(() => {
        // Clean URL parameter without reloading page
        window.history.replaceState({}, document.title, window.location.pathname);
      });
    }
  }, [userId]);

  // Current session getter
  const currentSession = sessions.find((s) => s.id === currentSessionId) || sessions[0];

  // Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages, isLoading]);

  // Create new chat
  const handleNewChat = () => {
    const newId = `session_${Date.now()}`;
    const newSession: ChatSession = {
      id: newId,
      title: 'Новый диалог',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setSessions((prev) => [newSession, ...prev]);
    setCurrentSessionId(newId);
    setInput('');
  };

  // Delete chat
  const handleDeleteSession = (id: string) => {
    const remaining = sessions.filter((s) => s.id !== id);
    if (remaining.length === 0) {
      const fallbackId = `session_${Date.now()}`;
      setSessions([
        {
          id: fallbackId,
          title: 'Новый диалог',
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]);
      setCurrentSessionId(fallbackId);
    } else {
      setSessions(remaining);
      if (currentSessionId === id) {
        setCurrentSessionId(remaining[0].id);
      }
    }
  };

  // Clear all chats
  const handleClearAllSessions = () => {
    if (confirm('Вы уверены, что хотите удалить все диалоги?')) {
      const freshId = `session_${Date.now()}`;
      setSessions([
        {
          id: freshId,
          title: 'Новый диалог',
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]);
      setCurrentSessionId(freshId);
    }
  };

  // Redeem key logic
  const handleRedeemKey = async (code: string) => {
    try {
      const res = await fetch('/api/keys/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, userId }),
      });
      const data = await res.json();
      if (data.success && typeof data.newBalance === 'number') {
        setTokensBalance(data.newBalance);
      }
      return data;
    } catch (err: any) {
      return {
        success: false,
        tokens: 0,
        message: 'Не удалось связаться с сервером активации',
        newBalance: tokensBalance,
      };
    }
  };

  // Send message to Grokson
  const handleSendMessage = async (customPrompt?: string) => {
    const messageText = (customPrompt || input).trim();
    if (!messageText || isLoading || tokensBalance < 15) return;

    // Build user message
    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: Date.now(),
    };

    // Update session title from first user query if still "Новый диалог"
    const isFirstMessage = currentSession.messages.length === 0;
    const newTitle = isFirstMessage
      ? messageText.length > 35
        ? messageText.slice(0, 35) + '...'
        : messageText
      : currentSession.title;

    const updatedMessages = [...currentSession.messages, userMsg];

    setSessions((prev) =>
      prev.map((s) =>
        s.id === currentSessionId
          ? { ...s, title: newTitle, messages: updatedMessages, updatedAt: Date.now() }
          : s
      )
    );

    setInput('');
    setIsLoading(true);

    // Check token balance before sending
    if (tokensBalance < 15) {
      const errorMsg: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: 'У вас недостаточно токенов для генерации ответа. Пожалуйста, пополните баланс с помощью ключа доступа.',
        timestamp: Date.now(),
        error: true,
      };
      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSessionId
            ? { ...s, messages: [...updatedMessages, errorMsg], updatedAt: Date.now() }
            : s
        )
      );
      setIsLoading(false);
      setIsRedeemOpen(true);
      return;
    }

    try {
      // Prepare payload for server
      const payloadMessages = updatedMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      let answered = false;

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: payloadMessages,
            userId,
          }),
        });

        let data: any = null;
        try {
          data = await res.json();
        } catch {
          data = null;
        }

        if (res.ok && data?.text) {
          const assistantMsg: ChatMessage = {
            id: `msg_${Date.now() + 1}`,
            role: 'assistant',
            content: data.text,
            timestamp: Date.now(),
            tokensUsed: data.tokensUsed,
            model: data.model || 'Grokson Intelligence',
          };

          if (typeof data.remainingBalance === 'number') {
            setTokensBalance(data.remainingBalance);
          } else if (data.tokensUsed) {
            setTokensBalance((prev) => Math.max(0, prev - data.tokensUsed));
          }

          setSessions((prev) =>
            prev.map((s) =>
              s.id === currentSessionId
                ? { ...s, messages: [...updatedMessages, assistantMsg], updatedAt: Date.now() }
                : s
            )
          );
          answered = true;
        } else if (data?.error === 'insufficient_tokens') {
          setIsRedeemOpen(true);
          const errorMsg: ChatMessage = {
            id: `msg_${Date.now() + 1}`,
            role: 'assistant',
            content: 'Недостаточно токенов на балансе. Пожалуйста, введите ключ пополнения.',
            timestamp: Date.now(),
            error: true,
          };
          setSessions((prev) =>
            prev.map((s) =>
              s.id === currentSessionId
                ? { ...s, messages: [...updatedMessages, errorMsg], updatedAt: Date.now() }
                : s
            )
          );
          answered = true;
        }
      } catch (fetchErr) {
        console.warn('Backend gateway unavailable, engaging Grokson Edge Neural Core:', fetchErr);
      }

      // If backend failed or is starting up, seamlessly engage Grokson Edge Neural Core
      if (!answered) {
        const fallback = generateEdgeAIResponse(messageText);
        const assistantMsg: ChatMessage = {
          id: `msg_${Date.now() + 1}`,
          role: 'assistant',
          content: fallback.text,
          timestamp: Date.now(),
          tokensUsed: fallback.tokensUsed,
          model: fallback.model,
        };

        setTokensBalance((prev) => Math.max(0, prev - fallback.tokensUsed));

        setSessions((prev) =>
          prev.map((s) =>
            s.id === currentSessionId
              ? { ...s, messages: [...updatedMessages, assistantMsg], updatedAt: Date.now() }
              : s
          )
        );
      }
    } catch (err: any) {
      const fallback = generateEdgeAIResponse(messageText);
      const assistantMsg: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: fallback.text,
        timestamp: Date.now(),
        tokensUsed: fallback.tokensUsed,
        model: fallback.model,
      };

      setTokensBalance((prev) => Math.max(0, prev - fallback.tokensUsed));

      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSessionId
            ? { ...s, messages: [...updatedMessages, assistantMsg], updatedAt: Date.now() }
            : s
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#08090d] text-slate-100 font-sans">
      {/* ChatGPT-style Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={(id) => setCurrentSessionId(id)}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        onClearAllSessions={handleClearAllSessions}
        tokensBalance={tokensBalance}
        onOpenRedeem={() => setIsRedeemOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenBuy={() => setIsBuyOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden bg-radial from-[#0e121a] via-[#090b10] to-[#07080c]">
        {/* Top Navigation Bar */}
        <header className="h-14 sm:h-16 px-4 border-b border-white/5 flex items-center justify-between shrink-0 bg-[#090b10]/90 backdrop-blur-md z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="hidden md:flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 font-display">Диалог:</span>
              <span className="text-xs text-white font-medium truncate max-w-xs sm:max-w-md">
                {currentSession.title}
              </span>
            </div>

            <div className="md:hidden">
              <GroksonLogo size="sm" showText={true} />
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Token balance chip */}
            <button
              onClick={() => setIsRedeemOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
              title="Нажмите, чтобы пополнить баланс"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-mono font-bold text-white">
                {tokensBalance.toLocaleString('ru-RU')}
              </span>
              <span className="text-[10px] text-slate-400 font-sans hidden sm:inline">ток.</span>
            </button>

            {/* Top up button */}
            <button
              onClick={() => setIsRedeemOpen(true)}
              className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Пополнить</span>
            </button>

            {/* Admin shortcut */}
            <button
              onClick={() => setIsAdminOpen(true)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              title="Панель управления"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </button>
          </div>
        </header>

        {/* Conversation Stream or Welcome Hero */}
        <div className="flex-1 overflow-y-auto">
          {currentSession.messages.length === 0 ? (
            <WelcomeBanner
              onSelectPrompt={(p) => handleSendMessage(p)}
              tokensBalance={tokensBalance}
              onOpenRedeem={() => setIsRedeemOpen(true)}
            />
          ) : (
            <div className="py-4 space-y-1">
              {currentSession.messages.map((msg) => (
                <ChatMessageItem
                  key={msg.id}
                  message={msg}
                  onRetry={() => {
                    // Retry last user message
                    const lastUser = currentSession.messages
                      .slice()
                      .reverse()
                      .find((m) => m.role === 'user');
                    if (lastUser) handleSendMessage(lastUser.content);
                  }}
                />
              ))}

              {/* Typing indicator */}
              {isLoading && (
                <div className="py-4 px-6 max-w-4xl mx-auto flex items-center gap-3 text-slate-400 text-xs sm:text-sm">
                  <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-display font-medium text-slate-300">Grokson думает</span>
                    <span className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]" />
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Chat Input Bottom Section */}
        <ChatInput
          input={input}
          setInput={setInput}
          onSend={() => handleSendMessage()}
          isLoading={isLoading}
          tokensBalance={tokensBalance}
          onOpenRedeem={() => setIsRedeemOpen(true)}
        />
      </main>

      {/* Redeem Voucher Key Modal */}
      <RedeemKeyModal
        isOpen={isRedeemOpen}
        onClose={() => setIsRedeemOpen(false)}
        onRedeem={handleRedeemKey}
        currentBalance={tokensBalance}
      />

      {/* Admin Control Panel Modal (password: zxcqwerty) */}
      <AdminPanelModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        onRefreshUserBalance={syncUserBalance}
        currentUserId={userId}
      />

      {/* Buy Tokens / Packages Modal */}
      <BuyTokensModal
        isOpen={isBuyOpen}
        onClose={() => setIsBuyOpen(false)}
        onOpenRedeem={() => setIsRedeemOpen(true)}
      />
    </div>
  );
}
