import React from 'react';
import { GroksonMascot } from './GroksonMascot';
import {
  FileSpreadsheet,
  Terminal,
  TrendingUp,
  ShieldCheck,
  ArrowRight,
  Zap,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';

interface WelcomeBannerProps {
  onSelectPrompt: (promptText: string) => void;
  tokensBalance: number;
  onOpenRedeem: () => void;
}

export const WelcomeBanner: React.FC<WelcomeBannerProps> = ({
  onSelectPrompt,
  tokensBalance,
  onOpenRedeem,
}) => {
  const capabilities = [
    {
      icon: <FileSpreadsheet className="w-4 h-4 text-slate-200" />,
      title: 'Системный и бизнес-анализ',
      subtitle: 'Аудит предметной области, выявление узких мест, структурированные отчёты',
      prompt: 'Подготовь детальный план стратегического аудита IT-инфраструктуры компании с матрицей рисков.',
    },
    {
      icon: <Terminal className="w-4 h-4 text-slate-200" />,
      title: 'Инженерия и архитектура ПО',
      subtitle: 'Отказоустойчивая микросервисная архитектура, написание чистого кода, ревью',
      prompt: 'Спроектируй масштабируемую архитектуру backend-сервиса с кэшированием, очередями задач и защитой от перегрузок.',
    },
    {
      icon: <TrendingUp className="w-4 h-4 text-slate-200" />,
      title: 'Стратегическое планирование',
      subtitle: 'Дорожные карты проектов, финансовое моделирование, план запуска продуктов',
      prompt: 'Составь регламент и пошаговый план вывода нового технологического продукта на рынок за 90 дней.',
    },
    {
      icon: <ShieldCheck className="w-4 h-4 text-slate-200" />,
      title: 'Информационная безопасность',
      subtitle: 'Политики ИБ, управление доступом, стандарты обработки и хранения данных',
      prompt: 'Сформулируй базовый регламент корпоративной информационной безопасности для удалённых сотрудников.',
    },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-4 md:py-6 space-y-6">
      {/* Official Executive Header Card */}
      <div className="relative overflow-hidden rounded-2xl bg-[#0b0d12] border border-white/10 p-6 sm:p-8 md:p-10 shadow-2xl">
        {/* Subtle grid pattern background */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
            backgroundSize: '28px 28px',
          }}
        />

        {/* Technical Status Strip */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4 mb-7">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/5 border border-white/10 text-[11px] font-mono font-medium text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>CORE: ACTIVE</span>
            </span>
            <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
              LATENCY: 18ms • TLS 1.3
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-[11px] tracking-[0.2em] text-slate-400 font-mono uppercase">
              PLATFORM EDITION 2.4
            </div>
          </div>
        </div>

        {/* Content Layout */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Official Overview */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-4">
            <div className="space-y-2">
              <div className="inline-block text-[11px] uppercase tracking-[0.2em] font-mono text-slate-400">
                GROKSON INTELLIGENCE PLATFORM
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black font-display text-white tracking-tight leading-tight">
                Корпоративная вычислительная система
              </h1>
            </div>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-xl font-normal">
              Высокопроизводительная изолированная среда для решения аналитических, инженерных и стратегических задач. Интегрирована с защищённым шлюзом вычислений, биллингом токенов и инструментами администрирования.
            </p>

            {/* Official Feature Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Комплексный анализ данных</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Проектирование архитектуры ПО</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Токенизированный биллинг</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Приватный защищённый шлюз</span>
              </div>
            </div>

            {/* Primary Actions */}
            <div className="pt-4 flex flex-wrap items-center gap-3">
              <button
                onClick={() =>
                  onSelectPrompt(
                    'Инициализируй сессию. Подготовь комплексный отчёт по аналитике технологического стека и системной оптимизации.'
                  )
                }
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-slate-950 font-bold text-xs uppercase tracking-wider hover:bg-slate-200 transition-all cursor-pointer shadow-md active:scale-98"
              >
                <span>Инициализировать сессию</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              {tokensBalance <= 50 && (
                <button
                  onClick={onOpenRedeem}
                  className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-semibold text-xs hover:bg-amber-500/20 transition-all cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>Ввести ключ токенов</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Column: High-tech Monolith Core */}
          <div className="lg:col-span-5 flex justify-center items-center">
            <GroksonMascot size="hero" showBubble={true} bubbleText="CORE: OPERATIONAL" />
          </div>
        </div>
      </div>

      {/* Structured Executive Capabilities Grid */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="text-xs uppercase font-mono tracking-wider text-slate-400">
            Специализированные направления вычислений
          </div>
          <span className="text-[11px] font-mono text-slate-500">READY</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {capabilities.map((item, idx) => (
            <button
              key={idx}
              onClick={() => onSelectPrompt(item.prompt)}
              className="text-left p-4 rounded-xl bg-[#0c0e14] border border-white/10 hover:border-white/25 hover:bg-[#12151e] transition-all group cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-white/5 border border-white/10 group-hover:bg-white/10 transition-colors">
                  {item.icon}
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-semibold text-white group-hover:text-slate-200 transition-colors font-display">
                    {item.title}
                  </div>
                  <div className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {item.subtitle}
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-slate-500 group-hover:text-slate-300 transition-colors">
                <span>Запустить сценарий</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
