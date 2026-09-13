import React, { useState } from 'react';
import {
  X,
  User,
  Coins,
  Shield,
  KeyRound,
  LogOut,
  Calendar,
  Sparkles,
  Check,
  AlertCircle,
  Clock,
  Edit2,
  Lock,
} from 'lucide-react';
import type { UserAccount } from '../types';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: UserAccount;
  onUpdateAccount: (updated: UserAccount) => void;
  onLogout: () => void;
  onOpenRedeem: () => void;
  onOpenBuy: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  account,
  onUpdateAccount,
  onLogout,
  onOpenRedeem,
  onOpenBuy,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(account.name);
  const [nameSaving, setNameSaving] = useState(false);

  // Password change state
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  if (!isOpen) return null;

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim() || nameInput.trim() === account.name) {
      setIsEditingName(false);
      return;
    }

    setNameSaving(true);
    try {
      const res = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: account.id,
          name: nameInput.trim(),
        }),
      });
      const data = await res.json();
      if (data.success && data.account) {
        onUpdateAccount(data.account);
      } else {
        onUpdateAccount({ ...account, name: nameInput.trim() });
      }
      setIsEditingName(false);
    } catch (err) {
      onUpdateAccount({ ...account, name: nameInput.trim() });
      setIsEditingName(false);
    } finally {
      setNameSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (!oldPassword || !newPassword) {
      setPasswordMsg({ type: 'error', text: 'Заполните старый и новый пароли' });
      return;
    }

    if (newPassword.length < 4) {
      setPasswordMsg({ type: 'error', text: 'Новый пароль должен содержать от 4 символов' });
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: account.id,
          oldPassword,
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Ошибка смены пароля');
      }

      setPasswordMsg({ type: 'success', text: 'Пароль успешно обновлён!' });
      setOldPassword('');
      setNewPassword('');
      setTimeout(() => {
        setShowPasswordChange(false);
        setPasswordMsg(null);
      }, 1500);
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.message || 'Неверный текущий пароль' });
    } finally {
      setPasswordSaving(false);
    }
  };

  const initials = (account.name || account.username || 'U')
    .slice(0, 2)
    .toUpperCase();

  const formattedDate = new Date(account.createdAt).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div
      id="account-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="account-modal-content"
        className="w-full max-w-md bg-[#0c0f17] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow accent */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="p-5 pb-4 border-b border-white/5 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-cyan-500/20">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white leading-none">
                  {account.name}
                </h2>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Активен
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 font-mono">@{account.username}</p>
            </div>
          </div>
          <button
            id="account-modal-close-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-4 relative z-10 max-h-[75vh] overflow-y-auto">
          {/* Balance card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-white/[0.07] to-white/[0.02] border border-white/10 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-cyan-400" />
                Баланс токенов
              </span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                PRO Аккаунт
              </span>
            </div>
            <div className="text-2xl font-black text-white tracking-tight flex items-baseline gap-1.5">
              <span>{account.tokensBalance.toLocaleString('ru-RU')}</span>
              <span className="text-xs font-normal text-slate-400">токенов</span>
            </div>

            {/* Actions for balance */}
            <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-white/5">
              <button
                id="account-redeem-btn"
                onClick={() => {
                  onClose();
                  onOpenRedeem();
                }}
                className="py-2 px-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ввести промокод</span>
              </button>
              <button
                id="account-buy-btn"
                onClick={() => {
                  onClose();
                  onOpenBuy();
                }}
                className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span>Пополнить</span>
              </button>
            </div>
          </div>

          {/* Account Details & Stats */}
          <div className="p-3.5 rounded-xl bg-black/30 border border-white/5 space-y-2.5 text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                Логин
              </span>
              <span className="font-mono text-white">@{account.username}</span>
            </div>

            {account.email && (
              <div className="flex items-center justify-between text-slate-400">
                <span>Email</span>
                <span className="text-slate-200">{account.email}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-slate-500" />
                Всего израсходовано
              </span>
              <span className="font-mono text-slate-300">
                {(account.totalTokensUsed || 0).toLocaleString('ru-RU')} тк.
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Дата регистрации
              </span>
              <span className="text-slate-300">{formattedDate}</span>
            </div>
          </div>

          {/* Edit Profile Form */}
          <div className="p-3.5 rounded-xl bg-black/30 border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Edit2 className="w-3.5 h-3.5 text-cyan-400" />
                Отображаемое имя
              </span>
              {!isEditingName && (
                <button
                  onClick={() => setIsEditingName(true)}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-medium cursor-pointer"
                >
                  Изменить
                </button>
              )}
            </div>

            {isEditingName ? (
              <form onSubmit={handleSaveName} className="flex gap-2">
                <input
                  type="text"
                  required
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-black/50 border border-white/10 rounded-lg text-white text-xs outline-none focus:border-cyan-500/50"
                  placeholder="Ваше имя"
                />
                <button
                  type="submit"
                  disabled={nameSaving}
                  className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  <span>Сохранить</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNameInput(account.name);
                    setIsEditingName(false);
                  }}
                  className="px-2 py-1.5 bg-white/5 hover:bg-white/10 text-slate-400 rounded-lg text-xs cursor-pointer"
                >
                  Отмена
                </button>
              </form>
            ) : (
              <div className="text-xs text-slate-300 pl-5">{account.name}</div>
            )}
          </div>

          {/* Security: Change Password */}
          <div className="p-3.5 rounded-xl bg-black/30 border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-indigo-400" />
                Безопасность и пароль
              </span>
              <button
                onClick={() => setShowPasswordChange(!showPasswordChange)}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
              >
                {showPasswordChange ? 'Свернуть' : 'Сменить пароль'}
              </button>
            </div>

            {showPasswordChange && (
              <form onSubmit={handleChangePassword} className="space-y-2.5 pt-1">
                {passwordMsg && (
                  <div
                    className={`p-2 rounded-lg text-[11px] flex items-center gap-2 ${
                      passwordMsg.type === 'success'
                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                        : 'bg-rose-500/10 border border-rose-500/20 text-rose-300'
                    }`}
                  >
                    {passwordMsg.type === 'success' ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5" />
                    )}
                    <span>{passwordMsg.text}</span>
                  </div>
                )}
                <div>
                  <input
                    type="password"
                    required
                    placeholder="Текущий пароль"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full px-3 py-1.5 bg-black/50 border border-white/10 rounded-lg text-white text-xs outline-none focus:border-indigo-500/50"
                  />
                </div>
                <div>
                  <input
                    type="password"
                    required
                    placeholder="Новый пароль (мин. 4 символа)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-1.5 bg-black/50 border border-white/10 rounded-lg text-white text-xs outline-none focus:border-indigo-500/50"
                  />
                </div>
                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="w-full py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  {passwordSaving ? 'Обновление...' : 'Обновить пароль'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Logout Footer */}
        <div className="p-4 bg-black/50 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Сессия защищена</span>
          </div>

          <button
            id="account-logout-btn"
            onClick={() => {
              if (window.confirm('Вы уверены, что хотите выйти из аккаунта?')) {
                onLogout();
                onClose();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Выйти из аккаунта</span>
          </button>
        </div>
      </div>
    </div>
  );
};
