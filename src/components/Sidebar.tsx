import React from 'react';
import { GroksonLogo } from './GroksonLogo';
import { ChatSession } from '../types';
import {
  Plus,
  MessageSquare,
  Trash2,
  Zap,
  ShieldCheck,
  PanelLeftClose,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  currentSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onClearAllSessions: () => void;
  tokensBalance: number;
  onOpenRedeem: () => void;
  onOpenAdmin: () => void;
  onOpenBuy: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onClearAllSessions,
  tokensBalance,
  onOpenRedeem,
  onOpenAdmin,
  onOpenBuy,
}) => {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-72 sm:w-80 bg-[#090b10] border-r border-white/5 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <GroksonLogo size="sm" />
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <PanelLeftClose className="w-5 h-5" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 768) onClose();
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium text-sm transition-all active:scale-98 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Новый диалог</span>
          </button>
        </div>

        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <div className="text-[11px] font-mono tracking-wider uppercase text-slate-500 px-3 py-1">
            История диалогов
          </div>

          {sessions.length === 0 ? (
            <div className="text-xs text-slate-500 text-center py-8 px-4">
              Пока нет сохранённых диалогов. Задайте вопрос Grokson!
            </div>
          ) : (
            sessions.map((session) => {
              const isActive = session.id === currentSessionId;
              return (
                <div
                  key={session.id}
                  className={`group relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-white/10 text-white font-medium shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                  onClick={() => {
                    onSelectSession(session.id);
                    if (window.innerWidth < 768) onClose();
                  }}
                >
                  <MessageSquare className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span className="truncate flex-1 text-xs sm:text-sm">{session.title}</span>

                  {/* Delete session button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.id);
                    }}
                    title="Удалить диалог"
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:text-rose-400 hover:bg-white/10 transition-opacity cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Token Balance Card */}
        <div className="p-3 border-t border-white/5">
          <div className="rounded-2xl bg-gradient-to-br from-[#121622] to-[#0d1017] border border-white/10 p-3.5 space-y-2.5 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Баланс токенов</span>
              </div>
              <span className="text-xs font-mono font-bold text-white px-2 py-0.5 rounded-md bg-white/5 border border-white/10">
                {tokensBalance.toLocaleString('ru-RU')}
              </span>
            </div>

            {/* Token Progress visual */}
            <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  tokensBalance > 1000
                    ? 'bg-white/80'
                    : 'bg-amber-400'
                }`}
                style={{ width: `${Math.min(100, Math.max(5, (tokensBalance / 25000) * 100))}%` }}
              />
            </div>

            {/* Actions for tokens */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={onOpenRedeem}
                className="w-full py-1.5 px-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Ввести ключ</span>
              </button>
              <button
                onClick={onOpenBuy}
                className="w-full py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-medium transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>Тарифы</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-3 border-t border-white/5 space-y-1 bg-[#06070a]">
          {/* Admin Panel button - without displaying the password */}
          <button
            onClick={() => {
              onOpenAdmin();
              if (window.innerWidth < 768) onClose();
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="font-medium">Панель управления</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Доступ</span>
          </button>

          {/* Clear history */}
          {sessions.length > 0 && (
            <button
              onClick={onClearAllSessions}
              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs text-slate-500 hover:text-rose-400 hover:bg-rose-500/5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Очистить все диалоги</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
