import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Globe,
  CheckCircle2,
  Copy,
  Check,
  Terminal,
  Server,
  ShieldCheck,
  ExternalLink,
  Zap,
  HelpCircle,
  Cpu,
} from 'lucide-react';

interface DeployGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeployGuideModal: React.FC<DeployGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'vercel' | 'render' | 'domain' | 'checklist'>('vercel');
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const gitCommands = `# 1. Инициализация репозитория (в терминале папки проекта)
git init
git add .
git commit -m "Deploy Grokson Intelligence Platform"

# 2. Создайте пустой репозиторий на github.com и привяжите его:
git branch -M main
git remote add origin https://github.com/ВАШ_ЛОГИН/grokson-ai.git
git push -u origin main`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 10 }}
          className="relative w-full max-w-4xl bg-[#0d0f14] border border-white/10 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#11141c]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-white">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white font-display uppercase tracking-wider">
                    Руководство по бесплатному деплою
                  </h2>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                    100% Free
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-sans">
                  Пошаговая инструкция публикации платформы в сеть без ошибок и без абонентской платы
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-white/10 bg-[#090b0f] px-6 gap-2 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab('vercel')}
              className={`py-3 px-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                activeTab === 'vercel'
                  ? 'border-white text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>1. Vercel (Рекомендуется, 2 мин)</span>
            </button>

            <button
              onClick={() => setActiveTab('render')}
              className={`py-3 px-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                activeTab === 'render'
                  ? 'border-white text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              <span>2. Render.com (Node.js Service)</span>
            </button>

            <button
              onClick={() => setActiveTab('domain')}
              className={`py-3 px-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                activeTab === 'domain'
                  ? 'border-white text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-slate-300" />
              <span>3. Свой домен (.ru / .com)</span>
            </button>

            <button
              onClick={() => setActiveTab('checklist')}
              className={`py-3 px-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                activeTab === 'checklist'
                  ? 'border-white text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>4. Чеклист без ошибок</span>
            </button>
          </div>

          {/* Content Body */}
          <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-300 font-sans">
            {/* TAB 1: VERCEL */}
            {activeTab === 'vercel' && (
              <div className="space-y-5">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-start gap-3">
                  <Cpu className="w-5 h-5 text-white shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-white text-sm">
                      Почему Vercel — идеальный бесплатный выбор?
                    </div>
                    <div className="text-xs text-slate-300 mt-1 leading-relaxed">
                      В репозитории уже полностью настроены <code className="text-white font-mono bg-black/40 px-1 py-0.5 rounded">vercel.json</code> и Serverless Handler <code className="text-white font-mono bg-black/40 px-1 py-0.5 rounded">/api/index.ts</code>. Vercel автоматически собирает клиент и поднимает бессерверный API без очередей и сбоев.
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Step 1 */}
                  <div className="p-4 rounded-xl bg-[#101219] border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-white font-semibold">
                        <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-mono">1</span>
                        <span>Выгрузить код на GitHub</span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(gitCommands, 'git')}
                        className="flex items-center gap-1 text-xs text-slate-300 hover:text-white px-2.5 py-1 rounded bg-white/5 border border-white/10 cursor-pointer"
                      >
                        {copiedIndex === 'git' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Копировать команды</span>
                      </button>
                    </div>
                    <p className="text-xs text-slate-400">
                      Откройте терминал в папке проекта и выполните команды:
                    </p>
                    <pre className="p-3 rounded-lg bg-black/70 border border-white/5 font-mono text-xs text-slate-300 overflow-x-auto">
                      {gitCommands}
                    </pre>
                  </div>

                  {/* Step 2 */}
                  <div className="p-4 rounded-xl bg-[#101219] border border-white/10 space-y-2">
                    <div className="flex items-center gap-2 text-white font-semibold">
                      <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-mono">2</span>
                      <span>Подключить репозиторий в Vercel</span>
                    </div>
                    <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                      <li>Перейдите на официальный сайт <a href="https://vercel.com" target="_blank" rel="noreferrer" className="text-white underline font-medium">vercel.com</a> и войдите через свой GitHub-аккаунт.</li>
                      <li>Нажмите <strong className="text-white">«Add New...» → «Project»</strong>.</li>
                      <li>В списке найдите ваш репозиторий <code className="text-white font-mono bg-black/40 px-1 rounded">grokson-ai</code> и нажмите <strong className="text-white">«Import»</strong>.</li>
                    </ul>
                  </div>

                  {/* Step 3 */}
                  <div className="p-4 rounded-xl bg-[#101219] border border-white/10 space-y-3">
                    <div className="flex items-center gap-2 text-white font-semibold">
                      <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-mono">3</span>
                      <span>Конфигурация сборки (Build Settings)</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                      <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
                        <span className="text-slate-400 block text-[11px]">Framework Preset:</span>
                        <span className="text-white font-bold">Vite</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
                        <span className="text-slate-400 block text-[11px]">Build Command:</span>
                        <span className="text-emerald-400 font-bold">vite build</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
                        <span className="text-slate-400 block text-[11px]">Output Directory:</span>
                        <span className="text-emerald-400 font-bold">dist</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
                        <span className="text-slate-400 block text-[11px]">Install Command:</span>
                        <span className="text-white font-bold">npm install</span>
                      </div>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="p-4 rounded-xl bg-[#101219] border border-white/10 space-y-3">
                    <div className="flex items-center gap-2 text-white font-semibold">
                      <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-mono">4</span>
                      <span>Переменные окружения (Environment Variables)</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      В секции <strong>Environment Variables</strong> на странице импорта добавьте:
                    </p>
                    <div className="space-y-2 text-xs font-mono">
                      <div className="p-2.5 rounded-lg bg-black/60 border border-white/5 flex items-center justify-between">
                        <div>
                          <span className="text-amber-400 font-bold">ADMIN_PASSWORD</span>
                          <span className="text-slate-400 block text-[10px]">Ваш персональный пароль от закрытой админ-панели</span>
                        </div>
                        <span className="text-slate-200">например: zxcqwerty</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-black/60 border border-white/5 flex items-center justify-between">
                        <div>
                          <span className="text-slate-300 font-bold">NODE_ENV</span>
                          <span className="text-slate-400 block text-[10px]">Режим запуска</span>
                        </div>
                        <span className="text-slate-200">production</span>
                      </div>
                    </div>
                  </div>

                  {/* Step 5 */}
                  <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white text-sm">
                        5. Нажмите кнопку «Deploy»!
                      </div>
                      <div className="text-xs text-slate-300 mt-0.5">
                        Через 30–50 секунд платформа будет онлайн на бесплатном домене вида <code className="text-emerald-300 font-mono">grokson-ai.vercel.app</code> с HTTPS сертификатом!
                      </div>
                    </div>
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: RENDER */}
            {activeTab === 'render' && (
              <div className="space-y-5">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="font-bold text-white text-sm">
                    Деплой на Render.com (Бесплатный Web Service)
                  </div>
                  <div className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Render предоставляет постоянный сервер Node.js с поддержкой WebSocket и долгоживущих процессов.
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-[#101219] border border-white/10 space-y-2">
                    <div className="text-white font-semibold text-xs">Шаги настройки:</div>
                    <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside">
                      <li>Зарегистрируйтесь на <a href="https://render.com" target="_blank" rel="noreferrer" className="text-white underline font-medium">render.com</a>.</li>
                      <li>Нажмите <strong className="text-white">New + → Web Service</strong>.</li>
                      <li>Подключите ваш GitHub репозиторий.</li>
                      <li>Выберите среду: <strong className="text-white">Node</strong>.</li>
                      <li>Укажите параметры:
                        <div className="mt-2 space-y-1 font-mono text-[11px] p-2.5 rounded bg-black/60 border border-white/5">
                          <div>Build Command: <span className="text-emerald-400">npm install && npm run build</span></div>
                          <div>Start Command: <span className="text-emerald-400">node dist/server.cjs</span></div>
                          <div>Instance Type: <span className="text-white">Free (0$ / month)</span></div>
                        </div>
                      </li>
                      <li>В разделе <strong>Environment Variables</strong> добавьте:
                        <div className="mt-1 font-mono text-[11px] p-2 rounded bg-black/60 border border-white/5">
                          ADMIN_PASSWORD=ваш_пароль<br />
                          NODE_ENV=production
                        </div>
                      </li>
                      <li>Нажмите <strong className="text-white">Create Web Service</strong>.</li>
                    </ol>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: CUSTOM DOMAIN */}
            {activeTab === 'domain' && (
              <div className="space-y-5">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="font-bold text-white text-sm">
                    Подключение собственного домена (например, grokson.ru)
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Подключение любого собственного домена в Vercel абсолютно бесплатно, а SSL-сертификат выпускается автоматически за 1 минуту.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-[#101219] border border-white/10 space-y-2">
                    <div className="text-white font-semibold text-xs">Настройка в панели Vercel:</div>
                    <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside">
                      <li>В Vercel Dashboard откройте проект → <strong>Settings → Domains</strong>.</li>
                      <li>Введите имя вашего домена (например <code className="text-white font-mono">ai-grokson.ru</code>) и нажмите <strong>Add</strong>.</li>
                      <li>Vercel покажет 2 DNS-записи, которые нужно прописать у вашего регистратора (Reg.ru, Beget, Namecheap и т.д.):
                        <div className="mt-2 space-y-1.5 font-mono text-[11px] p-2.5 rounded bg-black/60 border border-white/5">
                          <div>Тип: <span className="text-amber-400 font-bold">A</span> | Имя: <span className="text-white">@</span> | Значение: <span className="text-emerald-400">76.76.21.21</span></div>
                          <div>Тип: <span className="text-amber-400 font-bold">CNAME</span> | Имя: <span className="text-white">www</span> | Значение: <span className="text-emerald-400">cname.vercel-dns.com</span></div>
                        </div>
                      </li>
                      <li>После обновления DNS (обычно от 5 минут) сайт будет открываться по вашему красивому официальному адресу!</li>
                    </ol>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: ZERO-ERROR CHECKLIST */}
            {activeTab === 'checklist' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="font-bold text-white text-sm">
                    Чеклист «Чётко и без ошибок»:
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Всё уже настроено на программном уровне, чтобы развёртывание прошло гладко:
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-[#101219] border border-white/10 space-y-1">
                    <div className="flex items-center gap-2 text-white font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>CORS & Проксирование</span>
                    </div>
                    <p className="text-slate-400 leading-relaxed">
                      Все запросы на <code className="text-white font-mono">/api/*</code> настроены в vercel.json и Express, никаких CORS-блокировок в браузере не будет.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#101219] border border-white/10 space-y-1">
                    <div className="flex items-center gap-2 text-white font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Защищённый шлюз</span>
                    </div>
                    <p className="text-slate-400 leading-relaxed">
                      Токены авторизации и ключ нейросети скрыты на сервере и не видны в коде клиента.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#101219] border border-white/10 space-y-1">
                    <div className="flex items-center gap-2 text-white font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Баланс и выпуск ключей</span>
                    </div>
                    <p className="text-slate-400 leading-relaxed">
                      Генератор ключей в админке поддерживает мгновенные ссылки для покупателей (<code className="text-white font-mono">?key=CODE</code>) с авто-активацией.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#101219] border border-white/10 space-y-1">
                    <div className="flex items-center gap-2 text-white font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Адаптивность под мобильные</span>
                    </div>
                    <p className="text-slate-400 leading-relaxed">
                      Интерфейс безупречно масштабируется на iPhone, Android, планшетах и широкоформатных мониторах.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Bar */}
          <div className="flex items-center justify-between px-6 py-3.5 border-t border-white/10 bg-[#0c0e14]">
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Grokson Production Ready • Полная совместимость с Vercel и Docker</span>
            </div>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-white text-slate-950 font-bold text-xs hover:bg-slate-200 transition-all cursor-pointer"
            >
              Понятно, закрыть
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
