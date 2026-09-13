import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { callGigaChat } from './server/gigachat.js';
import {
  getOrCreateUser,
  deductUserTokens,
  topUpUserTokens,
  getAllKeys,
  createTokenKey,
  redeemTokenKey,
  revokeTokenKey,
  getAdminStats,
  getAllUsers,
} from './server/storage.js';

const DEFAULT_GIGACHAT_KEY =
  process.env.GIGACHAT_AUTH_KEY ||
  'MDFhMDk0NGMtZDg2MS03NTE4LTk1YzktOTY2NmI1ZWIyMTFhOmM2NGRjMDQzLWZjMTMtNGE0Ny1iMGM1LTJjMmM3NGU4ZDQ5MQ==';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'zxcqwerty';

const app = express();
app.use(express.json());

// Enable CORS for local/cross-origin requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-admin-password');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Middleware to verify admin access
function requireAdmin(req: Request, res: Response, next: () => void) {
  const adminPass = req.headers['x-admin-password'] || req.query.admin_password;
  if (adminPass !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Неверный пароль администратора' });
  }
  next();
}

// -------------------------------------------------------------
// API Routes
// -------------------------------------------------------------

// Health check and GigaChat status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    gigachatConfigured: Boolean(DEFAULT_GIGACHAT_KEY),
    timestamp: Date.now(),
  });
});

// Get or register a user session
app.get('/api/user/:id', (req, res) => {
  const userId = req.params.id;
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }
  const user = getOrCreateUser(userId);
  res.json({ user });
});

// Redeem a token voucher key
app.post('/api/keys/redeem', (req, res) => {
  const { code, userId } = req.body;
  if (!code || !userId) {
    return res.status(400).json({ success: false, message: 'Код ключа и userId обязательны' });
  }

  const result = redeemTokenKey(code, userId);
  res.json(result);
});

// Chat endpoint with GigaChat & token metering
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, userId } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    const currentUserId = userId || 'anonymous_guest';
    const user = getOrCreateUser(currentUserId);

    // Minimum balance check: user must have at least 15 tokens
    if (user.tokensBalance < 15) {
      return res.status(403).json({
        error: 'insufficient_tokens',
        message: 'Недостаточно токенов на балансе. Пожалуйста, активируйте ключ или пополните баланс.',
        balance: user.tokensBalance,
      });
    }

    // Call AI Engine
    let replyText = '';
    let tokensUsed = 0;
    let modelName = 'Grokson Neural Core';

    try {
      const gigaResponse = await callGigaChat(messages, DEFAULT_GIGACHAT_KEY);
      replyText = gigaResponse.text;
      tokensUsed = gigaResponse.usage?.total_tokens || 80;
      modelName = 'Grokson Neural Core';
    } catch (gigaErr: any) {
      console.error('AI provider error in /api/chat:', gigaErr.message);

      // Graceful fallback message
      replyText = `Привет! Я Grokson. В данный момент нейросетевой шлюз испытывает кратковременную нагрузку. Пожалуйста, отправь свой вопрос ещё раз через несколько секунд.`;
      tokensUsed = 20;
    }

    // Deduct tokens from user's balance
    deductUserTokens(currentUserId, tokensUsed);
    const updatedUser = getOrCreateUser(currentUserId);

    res.json({
      text: replyText,
      tokensUsed,
      remainingBalance: updatedUser.tokensBalance,
      model: modelName,
    });
  } catch (err: any) {
    console.error('Unhandled chat endpoint error:', err);
    res.status(500).json({ error: err.message || 'Внутренняя ошибка сервера' });
  }
});

// Admin Authentication check
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.json({ success: true, message: 'Авторизация успешна' });
  } else {
    res.status(401).json({ success: false, error: 'Неверный пароль администратора' });
  }
});

// Admin: Get all keys and dashboard stats
app.get('/api/admin/keys', requireAdmin, (req, res) => {
  const keys = getAllKeys();
  const stats = getAdminStats();
  res.json({ keys, stats });
});

// Admin: Create new token key (single or batch)
app.post('/api/admin/keys/create', requireAdmin, (req, res) => {
  const { tokens, label, maxUses, customCode, count } = req.body;

  if (!tokens || Number(tokens) <= 0) {
    return res.status(400).json({ error: 'Количество токенов должно быть больше 0' });
  }

  const batchCount = Math.min(20, Math.max(1, Number(count) || 1));
  const createdKeys = [];

  for (let i = 0; i < batchCount; i++) {
    const key = createTokenKey({
      tokens: Number(tokens),
      label: label ? `${label}${batchCount > 1 ? ` #${i + 1}` : ''}` : undefined,
      maxUses: Number(maxUses) || 1,
      customCode: batchCount === 1 ? customCode : undefined,
    });
    createdKeys.push(key);
  }

  res.json({
    success: true,
    keys: createdKeys,
    stats: getAdminStats(),
  });
});

// Admin: Revoke/delete key
app.delete('/api/admin/keys/:code', requireAdmin, (req, res) => {
  const { code } = req.params;
  const success = revokeTokenKey(code);
  res.json({ success, stats: getAdminStats() });
});

// Admin: Get all users
app.get('/api/admin/users', requireAdmin, (req, res) => {
  const users = getAllUsers();
  res.json({ users });
});

// Admin: Top-up tokens for a user directly
app.post('/api/admin/users/topup', requireAdmin, (req, res) => {
  const { targetUserId, tokens } = req.body;
  if (!targetUserId || !tokens) {
    return res.status(400).json({ error: 'targetUserId и tokens обязательны' });
  }
  const user = topUpUserTokens(targetUserId, Number(tokens));
  res.json({ success: true, user });
});

// -------------------------------------------------------------
// Server Start & Vite Middleware
// -------------------------------------------------------------
async function startServer() {
  const PORT = Number(process.env.PORT) || 3000;

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Grokson AI server running on http://0.0.0.0:${PORT}`);
  });
}

// Export for Vercel serverless functions
export default app;

// Only start listener if invoked directly
if (process.env.VERCEL !== '1') {
  startServer();
}
