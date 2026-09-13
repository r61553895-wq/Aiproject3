import React, { useRef, useEffect } from 'react';
import { Send, Sparkles, AlertCircle, Zap } from 'lucide-react';

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSend: () => void;
  isLoading: boolean;
  tokensBalance: number;
  onOpenRedeem: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  input,
  setInput,
  onSend,
  isLoading,
  tokensBalance,
  onOpenRedeem,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading && tokensBalance >= 15) {
        onSend();
      }
    }
  };

  const isLowBalance = tokensBalance < 15;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-4 pt-1">
      {/* Low balance warning banner if user has no tokens */}
      {isLowBalance && (
        <div className="mb-2.5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs sm:text-sm text-amber-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>У вас закончились токены. Активируйте ключ доступа для продолжения общения.</span>
          </div>
          <button
            onClick={onOpenRedeem}
            className="shrink-0 px-3 py-1 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Ввести ключ</span>
          </button>
        </div>
      )}

      {/* Input container */}
      <div className="relative rounded-2xl bg-[#11141b] border border-white/10 focus-within:border-white/25 focus-within:ring-1 focus-within:ring-white/20 transition-all shadow-xl">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isLowBalance
              ? 'Активируйте ключ токенов, чтобы задать вопрос...'
              : 'Спросите Grokson о чём угодно... (Enter для отправки)'
          }
          disabled={isLoading || isLowBalance}
          rows={1}
          className="w-full bg-transparent px-4 pt-3.5 pb-12 sm:pb-3.5 sm:pr-24 text-sm sm:text-base text-slate-100 placeholder:text-slate-500 focus:outline-none resize-none max-h-48 disabled:opacity-50"
        />

        {/* Action Controls */}
        <div className="absolute right-2.5 bottom-2.5 flex items-center gap-2">
          {/* Estimated token hint */}
          {input.trim() && !isLowBalance && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-400 font-mono px-2 py-1 rounded-lg bg-white/5">
              ~{Math.max(15, Math.ceil(input.trim().length / 3))} ток.
            </span>
          )}

          {/* Send button */}
          <button
            onClick={onSend}
            disabled={!input.trim() || isLoading || isLowBalance}
            className={`p-2.5 rounded-xl transition-all flex items-center justify-center cursor-pointer ${
              input.trim() && !isLoading && !isLowBalance
                ? 'bg-white text-slate-950 hover:bg-slate-200 active:scale-95 shadow-md'
                : 'bg-white/5 text-slate-500 cursor-not-allowed'
            }`}
            title="Отправить сообщение"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Footer disclaimer */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 px-1">
        <span>Grokson Neural Core • Приватный ИИ-диалог с точным расчётом токенов.</span>
        <button
          onClick={onOpenRedeem}
          className="hover:text-slate-300 transition-colors flex items-center gap-1 font-medium cursor-pointer"
        >
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>Пополнить баланс</span>
        </button>
      </div>
    </div>
  );
};
