import fs from 'fs';
import path from 'path';
import os from 'os';
import type { TokenKey, UserSession, AdminStats } from '../src/types';

interface StoreData {
  keys: Record<string, TokenKey>;
  users: Record<string, UserSession>;
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
  totalTokensConsumed: 0,
};

let memoryStore: StoreData = { ...INITIAL_DATA };

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
