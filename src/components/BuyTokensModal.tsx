import React from 'react';
import { X, Zap, Check, Sparkles, Send, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BuyTokensModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRedeem: () => void;
}

export const BuyTokensModal: React.FC<BuyTokensModalProps> = ({
  isOpen,
  onClose,
  onOpenRedeem,
}) => {
  if (!isOpen) return null;

  const packages = [
    {
      name: 'Стартовый',
      tokens: 15000,
      price: '199 ₽',
      popular: false,
      features: ['~75 подробных ответов', 'Приоритетный доступ без очередей', 'Без ограничения по времени'],
    },
    {
      name: 'Оптимальный',
      tokens: 60000,
      price: '499 ₽',
      popular: true,
      features: ['~300 подробных ответов', 'Высокая скорость обработки', 'Поддержка длинных контекстов', 'Выгода 25%'],
    },
    {
      name: 'Профессионал',
      tokens: 200000,
      price: '1 290 ₽',
      popular: false,
      features: ['~1 000+ подробных ответов', 'Максимальный шлюз генерации', 'Для работы, учёбы и программирования', 'Выгода 40%'],
    },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="relative w-full max-w-2xl bg-[#0c0e14] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="text-center max-w-md mx-auto mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs font-mono mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Тарифы и пополнение</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white font-display">
              Пакеты токенов Grokson
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Выберите нужный объём токенов для общения с ИИ. Токены не сгорают со временем.
            </p>
          </div>

          {/* Packages Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-6">
            {packages.map((pkg) => (
              <div
                key={pkg.name}
                className={`relative rounded-2xl p-4 flex flex-col justify-between border transition-all ${
                  pkg.popular
                    ? 'bg-[#151720] border-white/30 shadow-xl shadow-black/40'
                    : 'bg-[#0f1117] border-white/10 hover:border-white/20'
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-white text-slate-950 font-bold text-[10px] tracking-wider uppercase font-mono shadow-sm">
                    Хит продаж
                  </div>
                )}

                <div>
                  <div className="text-sm font-bold text-white font-display">{pkg.name}</div>
                  <div className="text-xl font-black text-white font-mono mt-1">{pkg.price}</div>
                  <div className="text-xs text-amber-400 font-mono font-semibold mb-3">
                    +{pkg.tokens.toLocaleString('ru-RU')} токенов
                  </div>

                  <div className="space-y-1.5 text-[11px] text-slate-300">
                    {pkg.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-1.5">
                        <Check className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => {
                      onClose();
                      onOpenRedeem();
                    }}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      pkg.popular
                        ? 'bg-white text-slate-950 hover:bg-slate-200 shadow-md'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    Активировать ключ
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* How it works info */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
              <span>После покупки администратор отправляет вам код ключа для мгновенной активации.</span>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenRedeem();
              }}
              className="shrink-0 text-slate-200 hover:text-white font-semibold underline cursor-pointer"
            >
              Уже есть ключ? Ввести
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
