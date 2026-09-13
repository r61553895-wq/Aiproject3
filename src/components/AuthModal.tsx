import React, { useState } from 'react';
import {
  X,
  User,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  LogIn,
  UserPlus,
} from 'lucide-react';
import type { UserAccount } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (account: UserAccount) => void;
  currentUserId: string;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentUserId,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form fields
  const [loginField, setLoginField] = useState('');
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  if (!isOpen) return null;

  const resetForm = () => {
    setError(null);
    setSuccessMsg(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!loginField.trim() || !password) {
      setError('Пожалуйста, заполните логин и пароль');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          login: loginField.trim(),
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Ошибка входа. Проверьте данные.');
      }

      setSuccessMsg('Вход выполнен успешно!');
      setTimeout(() => {
        onSuccess(data.account);
        onClose();
      }, 500);
    } catch (err: any) {
      // Offline / network fallback
      setError(err.message || 'Не удалось связаться с сервером. Попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanUser = registerUsername.trim();
    if (!cleanUser || cleanUser.length < 3) {
      setError('Логин должен содержать не менее 3 символов');
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(cleanUser)) {
      setError('Логин может содержать только латинские буквы, цифры и знаки _ -');
      return;
    }

    if (!password || password.length < 4) {
      setError('Пароль должен содержать минимум 4 символа');
      return;
    }

    if (password !== confirmPassword) {
      setError('Введённые пароли не совпадают');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: cleanUser,
          email: registerEmail.trim() || undefined,
          name: registerName.trim() || cleanUser,
          password,
          currentUserId,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Ошибка регистрации');
      }

      setSuccessMsg(data.message || 'Аккаунт успешно создан!');
      setTimeout(() => {
        onSuccess(data.account);
        onClose();
      }, 600);
    } catch (err: any) {
      setError(err.message || 'Ошибка создания аккаунта. Попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="auth-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="auth-modal-content"
        className="w-full max-w-md bg-[#0c0f17] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow accent */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="p-5 pb-4 border-b border-white/5 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              {mode === 'login' ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                {mode === 'login' ? 'Вход в аккаунт' : 'Регистрация аккаунта'}
              </h2>
              <p className="text-xs text-slate-400">
                {mode === 'login'
                  ? 'Синхронизация баланса и диалогов'
                  : 'Получите +10 000 токенов в подарок'}
              </p>
            </div>
          </div>
          <button
            id="auth-modal-close-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="p-4 pb-0 relative z-10">
          <div className="grid grid-cols-2 p-1 bg-white/5 rounded-xl border border-white/5 text-xs font-medium">
            <button
              id="auth-tab-login"
              type="button"
              onClick={() => {
                setMode('login');
                resetForm();
              }}
              className={`py-2 rounded-lg transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-white font-semibold border border-cyan-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Вход
            </button>
            <button
              id="auth-tab-register"
              type="button"
              onClick={() => {
                setMode('register');
                resetForm();
              }}
              className={`py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                mode === 'register'
                  ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-white font-semibold border border-cyan-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Создать аккаунт</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                +10K
              </span>
            </button>
          </div>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{error}</div>
          </div>
        )}

        {successMsg && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-2.5 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{successMsg}</div>
          </div>
        )}

        {/* Form Body */}
        <div className="p-4 relative z-10">
          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Логин или Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="auth-login-input"
                    type="text"
                    required
                    value={loginField}
                    onChange={(e) => setLoginField(e.target.value)}
                    placeholder="Введите логин или email"
                    className="w-full pl-9 pr-3 py-2.5 bg-black/40 border border-white/10 focus:border-cyan-500/50 rounded-xl text-white text-sm placeholder:text-slate-500 outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Пароль</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="auth-password-input"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ваш пароль"
                    className="w-full pl-9 pr-10 py-2.5 bg-black/40 border border-white/10 focus:border-cyan-500/50 rounded-xl text-white text-sm placeholder:text-slate-500 outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  id="auth-submit-login"
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Войти</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3">
              {/* Registration bonus callout */}
              <div className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-[11px] text-amber-200">
                  При регистрации вы получаете <strong>10 000 токенов</strong> и вечное сохранение баланса.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Логин *
                  </label>
                  <div className="relative">
                    <input
                      id="auth-reg-username"
                      type="text"
                      required
                      value={registerUsername}
                      onChange={(e) => setRegisterUsername(e.target.value)}
                      placeholder="alex_99"
                      className="w-full px-3 py-2 bg-black/40 border border-white/10 focus:border-cyan-500/50 rounded-xl text-white text-xs placeholder:text-slate-500 outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Имя (по желанию)
                  </label>
                  <div className="relative">
                    <input
                      id="auth-reg-name"
                      type="text"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      placeholder="Александр"
                      className="w-full px-3 py-2 bg-black/40 border border-white/10 focus:border-cyan-500/50 rounded-xl text-white text-xs placeholder:text-slate-500 outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Email (по желанию)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-3.5 h-3.5" />
                  </div>
                  <input
                    id="auth-reg-email"
                    type="email"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full pl-9 pr-3 py-2 bg-black/40 border border-white/10 focus:border-cyan-500/50 rounded-xl text-white text-xs placeholder:text-slate-500 outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Пароль *
                  </label>
                  <input
                    id="auth-reg-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Мин. 4 символа"
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 focus:border-cyan-500/50 rounded-xl text-white text-xs placeholder:text-slate-500 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Повтор пароля *
                  </label>
                  <input
                    id="auth-reg-confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Повторите пароль"
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 focus:border-cyan-500/50 rounded-xl text-white text-xs placeholder:text-slate-500 outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{showPassword ? 'Скрыть пароли' : 'Показать пароли'}</span>
                </button>
              </div>

              <div className="pt-2">
                <button
                  id="auth-submit-register"
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Зарегистрироваться (+10 000 бонусов)</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Security badge footer */}
        <div className="p-3 bg-black/50 border-t border-white/5 flex items-center justify-center gap-2 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Данные учётной записи зашифрованы алгоритмом SHA-256</span>
        </div>
      </div>
    </div>
  );
};
