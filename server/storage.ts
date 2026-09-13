import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import type { TokenKey, UserSession, AdminStats, UserAccount } from '../src/types';

interface StoredAccount {
  id: string;
  username: string;
  email?: string;
  passwordHash: string;
  name: string;
  createdAt: number;
  lastLoginAt: number;
  role?: 'user' | 'admin';
}

interface StoreData {
  keys: Record<string, TokenKey>;
  users: Record<string, UserSession>;
  accounts: Record<string, StoredAccount>;
  totalTokensConsumed: number;
}

// In Vercel serverless functions, process.cwd() is read-only (/var/task).
// Only os.tmpdir() is writable in serverless environments.
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const DATA_DIR = isServerless
  ? path.join(os.tmpdir(), 'grokson_data')
  : path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');

const INITIAL_DATA: StoreData = {
  keys: {
    'GROK-START-10K': {
      code: 'GROK-START-10K',
      tokens: 10000,
      label: 'Стартовый промо-ключ (10,000 токенов)',
      createdAt: Date.now(),
      isRedeemed: false,
      maxUses: 100, // Multi-use promo
      usedCount: 0,
    },
    'GROK-PRO-50K': {
      code: 'GROK-PRO-50K',
      tokens: 50000,
      label: 'Промо-пакет PRO (50,000 токенов)',
      createdAt: Date.now(),
      isRedeemed: false,
      maxUses: 10,
      usedCount: 0,
    },
    'GROK-VIP-100K': {
      code: 'GROK-VIP-100K',
      tokens: 100000,
      label: 'VIP ключ (100,000 токенов)',
      createdAt: Date.now(),
      isRedeemed: false,
      maxUses: 1,
      usedCount: 0,
    },
  },
  users: {},
  accounts: {},
  totalTokensConsumed: 0,
};

let memoryStore: StoreData = { ...INITIAL_DATA };

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'grokson_salt_2026').digest('hex');
}

function loadStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      memoryStore = {
        keys: { ...INITIAL_DATA.keys, ...(parsed.keys || {}) },
        users: parsed.users || {},
        accounts: parsed.accounts || {},
        totalTokensConsumed: parsed.totalTokensConsumed || 0,
      };
    } else {
      saveStore();
    }
  } catch (err) {
    console.error('Error loading data store, using memoryStore fallback:', err);
  }
}

function saveStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(memoryStore, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving data store:', err);
  }
}

// Initialize on load
loadStore();

export function getOrCreateUser(userId: string): UserSession {
  if (!memoryStore.users[userId]) {
    // New users start with 5,000 bonus tokens
    memoryStore.users[userId] = {
      id: userId,
      name: `Пользователь #${userId.slice(0, 5)}`,
      tokensBalance: 5000,
      totalTokensUsed: 0,
      createdAt: Date.now(),
      lastActive: Date.now(),
    };
    saveStore();
  }
  memoryStore.users[userId].lastActive = Date.now();
  return memoryStore.users[userId];
}

export function deductUserTokens(userId: string, tokens: number): boolean {
  const user = getOrCreateUser(userId);
  if (user.tokensBalance < tokens) {
    return false;
  }
  user.tokensBalance = Math.max(0, user.tokensBalance - tokens);
  user.totalTokensUsed += tokens;
  memoryStore.totalTokensConsumed += tokens;
  saveStore();
  return true;
}

export function topUpUserTokens(userId: string, tokens: number): UserSession {
  const user = getOrCreateUser(userId);
  user.tokensBalance += tokens;
  saveStore();
  return user;
}

export function getAllKeys(): TokenKey[] {
  return Object.values(memoryStore.keys).sort((a, b) => b.createdAt - a.createdAt);
}

export function createTokenKey(params: {
  tokens: number;
  label?: string;
  maxUses?: number;
  customCode?: string;
}): TokenKey {
  const tokens = Math.max(1, Math.floor(params.tokens));
  let code = params.customCode?.trim().toUpperCase();

  if (!code) {
    const part1 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const part2 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const part3 = Math.random().toString(36).substring(2, 6).toUpperCase();
    code = `GROK-${part1}-${part2}-${part3}`;
  }

  const key: TokenKey = {
    code,
    tokens,
    label: params.label || `Ключ на ${tokens.toLocaleString('ru-RU')} токенов`,
    createdAt: Date.now(),
    isRedeemed: false,
    maxUses: params.maxUses && params.maxUses > 0 ? params.maxUses : 1,
    usedCount: 0,
  };

  memoryStore.keys[code] = key;
  saveStore();
  return key;
}

export function redeemTokenKey(code: string, userId: string): { success: boolean; tokens: number; message: string; newBalance: number } {
  const cleanCode = code.trim().toUpperCase();
  const key = memoryStore.keys[cleanCode];

  if (!key) {
    return {
      success: false,
      tokens: 0,
      message: 'Ключ не найден. Проверьте правильность ввода кода.',
      newBalance: getOrCreateUser(userId).tokensBalance,
    };
  }

  if (key.usedCount >= key.maxUses) {
    return {
      success: false,
      tokens: 0,
      message: 'Этот ключ уже был использован максимальное количество раз.',
      newBalance: getOrCreateUser(userId).tokensBalance,
    };
  }

  key.usedCount += 1;
  if (key.usedCount >= key.maxUses) {
    key.isRedeemed = true;
    key.redeemedAt = Date.now();
    key.redeemedBy = userId;
  }

  const user = topUpUserTokens(userId, key.tokens);
  saveStore();

  return {
    success: true,
    tokens: key.tokens,
    message: `Ключ успешно активирован! Начислено +${key.tokens.toLocaleString('ru-RU')} токенов.`,
    newBalance: user.tokensBalance,
  };
}

export function revokeTokenKey(code: string): boolean {
  const cleanCode = code.trim().toUpperCase();
  if (memoryStore.keys[cleanCode]) {
    delete memoryStore.keys[cleanCode];
    saveStore();
    return true;
  }
  return false;
}

export function getAdminStats(): AdminStats {
  const keys = Object.values(memoryStore.keys);
  const totalKeys = keys.length;
  const activeKeys = keys.filter((k) => k.usedCount < k.maxUses).length;
  const redeemedKeys = keys.filter((k) => k.usedCount >= k.maxUses).length;

  const totalTokensIssued = keys.reduce((acc, k) => acc + k.tokens * k.maxUses, 0);
  const totalTokensRedeemed = keys.reduce((acc, k) => acc + k.tokens * k.usedCount, 0);

  return {
    totalKeys,
    activeKeys,
    redeemedKeys,
    totalTokensIssued,
    totalTokensRedeemed,
    totalTokensConsumed: memoryStore.totalTokensConsumed,
    totalUsers: Object.keys(memoryStore.users).length,
  };
}

export function getAllUsers(): UserSession[] {
  return Object.values(memoryStore.users).sort((a, b) => b.lastActive - a.lastActive);
}

// ----------------- Account Management System -----------------

export function registerAccount(params: {
  username: string;
  email?: string;
  password: string;
  name?: string;
  currentUserId?: string;
}): { success: boolean; message: string; account?: UserAccount } {
  const cleanUsername = params.username.trim().toLowerCase();
  const cleanEmail = params.email?.trim().toLowerCase();
  const rawPassword = params.password.trim();

  if (!cleanUsername || cleanUsername.length < 3) {
    return { success: false, message: 'Логин должен содержать не менее 3 символов' };
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(cleanUsername)) {
    return { success: false, message: 'Логин может содержать только латинские буквы, цифры и знаки _ -' };
  }

  if (!rawPassword || rawPassword.length < 4) {
    return { success: false, message: 'Пароль должен содержать не менее 4 символов' };
  }

  // Check if username already exists
  const existingByUsername = Object.values(memoryStore.accounts).find(
    (a) => a.username.toLowerCase() === cleanUsername
  );
  if (existingByUsername) {
    return { success: false, message: 'Пользователь с таким логином уже зарегистрирован' };
  }

  // Check if email already exists
  if (cleanEmail) {
    const existingByEmail = Object.values(memoryStore.accounts).find(
      (a) => a.email && a.email.toLowerCase() === cleanEmail
    );
    if (existingByEmail) {
      return { success: false, message: 'Пользователь с таким email уже зарегистрирован' };
    }
  }

  const accountId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const displayName = params.name?.trim() || cleanUsername;

  // New account gets a welcome package of 10,000 tokens (or retains previous higher guest balance + 5000)
  let initialBalance = 10000;
  let initialUsed = 0;
  if (params.currentUserId && memoryStore.users[params.currentUserId]) {
    const guestUser = memoryStore.users[params.currentUserId];
    initialBalance = Math.max(initialBalance, guestUser.tokensBalance + 5000);
    initialUsed = guestUser.totalTokensUsed;
  }

  const storedAccount: StoredAccount = {
    id: accountId,
    username: cleanUsername,
    email: cleanEmail || undefined,
    passwordHash: hashPassword(rawPassword),
    name: displayName,
    createdAt: Date.now(),
    lastLoginAt: Date.now(),
    role: 'user',
  };

  memoryStore.accounts[accountId] = storedAccount;

  // Create/link user session in users map
  memoryStore.users[accountId] = {
    id: accountId,
    username: cleanUsername,
    email: cleanEmail || undefined,
    name: displayName,
    tokensBalance: initialBalance,
    totalTokensUsed: initialUsed,
    createdAt: Date.now(),
    lastActive: Date.now(),
    isRegistered: true,
  };

  saveStore();

  const userAccount: UserAccount = {
    id: storedAccount.id,
    username: storedAccount.username,
    email: storedAccount.email,
    name: storedAccount.name,
    tokensBalance: initialBalance,
    totalTokensUsed: initialUsed,
    createdAt: storedAccount.createdAt,
    lastLoginAt: storedAccount.lastLoginAt,
    role: storedAccount.role,
  };

  return {
    success: true,
    message: 'Регистрация прошла успешно! Вам начислен стартовый бонус +10 000 токенов.',
    account: userAccount,
  };
}

export function loginAccount(params: {
  login: string;
  password: string;
}): { success: boolean; message: string; account?: UserAccount } {
  const cleanLogin = params.login.trim().toLowerCase();
  const rawPassword = params.password.trim();

  if (!cleanLogin || !rawPassword) {
    return { success: false, message: 'Заполните логин и пароль' };
  }

  const account = Object.values(memoryStore.accounts).find(
    (a) => a.username.toLowerCase() === cleanLogin || (a.email && a.email.toLowerCase() === cleanLogin)
  );

  if (!account) {
    return { success: false, message: 'Пользователь с таким логином или email не найден' };
  }

  const hash = hashPassword(rawPassword);
  if (hash !== account.passwordHash) {
    return { success: false, message: 'Неверный пароль' };
  }

  account.lastLoginAt = Date.now();
  const session = getOrCreateUser(account.id);
  session.lastActive = Date.now();
  session.username = account.username;
  session.email = account.email;
  session.name = account.name;
  session.isRegistered = true;

  saveStore();

  const userAccount: UserAccount = {
    id: account.id,
    username: account.username,
    email: account.email,
    name: account.name,
    tokensBalance: session.tokensBalance,
    totalTokensUsed: session.totalTokensUsed,
    createdAt: account.createdAt,
    lastLoginAt: account.lastLoginAt,
    role: account.role,
  };

  return {
    success: true,
    message: 'Вход выполнен успешно',
    account: userAccount,
  };
}

export function getAccountById(id: string): UserAccount | null {
  const account = memoryStore.accounts[id];
  if (!account) return null;
  const session = memoryStore.users[id] || getOrCreateUser(id);
  return {
    id: account.id,
    username: account.username,
    email: account.email,
    name: account.name,
    tokensBalance: session.tokensBalance,
    totalTokensUsed: session.totalTokensUsed,
    createdAt: account.createdAt,
    lastLoginAt: account.lastLoginAt,
    role: account.role,
  };
}

export function updateAccountProfile(id: string, updates: { name?: string }): { success: boolean; account?: UserAccount } {
  const account = memoryStore.accounts[id];
  if (!account) return { success: false };
  if (updates.name && updates.name.trim()) {
    account.name = updates.name.trim();
    if (memoryStore.users[id]) {
      memoryStore.users[id].name = account.name;
    }
    saveStore();
  }
  return { success: true, account: getAccountById(id) || undefined };
}

export function changeAccountPassword(id: string, oldPass: string, newPass: string): { success: boolean; message: string } {
  const account = memoryStore.accounts[id];
  if (!account) return { success: false, message: 'Аккаунт не найден' };

  if (hashPassword(oldPass.trim()) !== account.passwordHash) {
    return { success: false, message: 'Неверный текущий пароль' };
  }

  if (!newPass || newPass.trim().length < 4) {
    return { success: false, message: 'Новый пароль должен быть не менее 4 символов' };
  }

  account.passwordHash = hashPassword(newPass.trim());
  saveStore();
  return { success: true, message: 'Пароль успешно изменён' };
}

