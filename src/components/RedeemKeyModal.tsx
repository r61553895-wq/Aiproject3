import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { X, KeyRound, Sparkles, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RedeemKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRedeem: (code: string) => Promise<{ success: boolean; tokens: number; message: string; newBalance: number }>;
  currentBalance: number;
}

export const RedeemKeyModal: React.FC<RedeemKeyModalProps> = ({
  isOpen,
  onClose,
  onRedeem,
  currentBalance,
}) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; tokens?: number } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || loading) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await onRedeem(code.trim().toUpperCase());
      setResult({
        success: res.success,
        message: res.message,
        tokens: res.tokens,
      });

      if (res.success) {
        // Fire celebration confetti
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#38bdf8', '#34d399', '#ffffff', '#fbbf24'],
          });
        } catch (e) {
          // ignore if canvas blocked
        }
        setCode('');
      }
    } catch (err: any) {
      setResult({
        success: false,
        message: err.message || 'Ошибка активации ключа',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickKey = (testCode: string) => {
    setCode(testCode);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-md bg-[#0e1118] border border-white/10 rounded-3xl p-6 sm:p-7 shadow-2xl overflow-hidden"
        >
          {/* Ambient glow */}
          <div className="absolute -top-20 -right-20 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="p-3 rounded-2xl bg-white/10 border border-white/15 text-white">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-display">Активация ключа</h3>
              <p className="text-xs text-slate-400">Пополните ваш персональный баланс токенов</p>
            </div>
          </div>

          {/* Current balance indicator */}
          <div className="mb-5 p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
            <span className="text-xs text-slate-300">Текущий баланс:</span>
            <span className="text-sm font-mono font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              {currentBalance.toLocaleString('ru-RU')} токенов
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Код токен-ключа (ваучера)
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="например GROK-START-10K"
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-white/40 focus:outline-none text-white font-mono text-sm tracking-wider uppercase placeholder:text-slate-600 placeholder:normal-case"
              />
            </div>

            {/* Status alert */}
            {result && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded-xl flex items-start gap-2.5 text-xs sm:text-sm ${
                  result.success
                    ? 'bg-emerald-950/40 border border-emerald-800/40 text-emerald-300'
                    : 'bg-rose-950/40 border border-rose-800/40 text-rose-300'
                }`}
              >
                {result.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <span>{result.message}</span>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={!code.trim() || loading}
              className="w-full py-3 px-4 rounded-xl bg-white text-slate-950 font-bold text-sm hover:bg-slate-200 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-white/5"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Активировать токены</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Keys for Testing */}
          <div className="mt-6 pt-4 border-t border-white/5">
            <div className="text-[11px] uppercase font-mono tracking-wider text-slate-500 mb-2">
              Промо-ключи для быстрой проверки:
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleQuickKey('GROK-START-10K')}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-mono text-slate-200 transition-colors cursor-pointer"
              >
                GROK-START-10K (+10K)
              </button>
              <button
                type="button"
                onClick={() => handleQuickKey('GROK-PRO-50K')}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-mono text-slate-200 transition-colors cursor-pointer"
              >
                GROK-PRO-50K (+50K)
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
