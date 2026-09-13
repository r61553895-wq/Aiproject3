import React, { useState } from 'react';
import Markdown from 'react-markdown';
import { ChatMessage } from '../types';
import { GroksonMascot } from './GroksonMascot';
import { Copy, Check, User, Sparkles, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface ChatMessageItemProps {
  message: ChatMessage;
  onRetry?: () => void;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ message, onRetry }) => {
  const [copied, setCopied] = useState(false);
  const isAssistant = message.role === 'assistant';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`w-full py-4 px-3 sm:px-6 transition-colors ${
        isAssistant ? 'bg-[#0c0f16]/60 border-y border-white/[0.03]' : 'bg-transparent'
      }`}
    >
      <div className="max-w-4xl mx-auto flex items-start gap-3 sm:gap-4">
        {/* Avatar */}
        <div className="shrink-0 pt-0.5">
          {isAssistant ? (
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-b from-[#181d27] to-[#0d1017] border border-white/15 flex items-center justify-center shadow-md overflow-hidden">
              <GroksonMascot size="sm" showBubble={false} />
            </div>
          ) : (
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-800/80 border border-white/10 flex items-center justify-center text-slate-300 shadow-md">
              <User className="w-4 h-4 text-slate-300" />
            </div>
          )}
        </div>

        {/* Message body */}
        <div className="flex-1 min-w-0 space-y-1.5">
          {/* Header metadata */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-white tracking-wide font-display">
                {isAssistant ? 'Grokson' : 'Вы'}
              </span>
              {isAssistant && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300 font-mono">
                  {message.model || 'Grokson Core'}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {message.tokensUsed !== undefined && message.tokensUsed > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-mono text-amber-300/90 bg-amber-950/30 border border-amber-800/30 px-2 py-0.5 rounded-full">
                  <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                  <span>{message.tokensUsed} токенов</span>
                </span>
              )}

              {/* Copy button */}
              <button
                onClick={handleCopy}
                title="Копировать текст"
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Text Content */}
          <div className="text-sm sm:text-[15px] leading-relaxed text-slate-200 break-words">
            {message.error ? (
              <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-800/40 text-rose-300 flex items-start gap-2.5 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <div className="flex-1">
                  <div>{message.content}</div>
                  {onRetry && (
                    <button
                      onClick={onRetry}
                      className="mt-2 text-xs font-semibold text-rose-200 underline hover:text-white cursor-pointer"
                    >
                      Попробовать снова
                    </button>
                  )}
                </div>
              </div>
            ) : isAssistant ? (
              <div className="markdown-body">
                <Markdown>{message.content}</Markdown>
              </div>
            ) : (
              <div className="whitespace-pre-wrap">{message.content}</div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
