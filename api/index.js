// server/app.ts
import express from "express";

// server/gigachat.ts
import https from "https";
import crypto from "crypto";
var cachedAccessToken = null;
var tokenExpiresAt = 0;
async function getGigaChatAccessToken(authKey) {
  if (cachedAccessToken && Date.now() < tokenExpiresAt - 6e4) {
    return cachedAccessToken;
  }
  return new Promise((resolve, reject) => {
    const rqUid = crypto.randomUUID();
    const postData = "scope=GIGACHAT_API_PERS";
    const req = https.request(
      {
        hostname: "ngw.devices.sberbank.ru",
        port: 9443,
        path: "/api/v2/oauth",
        method: "POST",
        rejectUnauthorized: false,
        // Required for Russian Ministry of Digital certificates in Node.js
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Accept": "application/json",
          "RqUID": rqUid,
          "Authorization": `Basic ${authKey.trim()}`,
          "Content-Length": Buffer.byteLength(postData)
        }
      },
      (res) => {
        let rawData = "";
        res.on("data", (chunk) => rawData += chunk);
        res.on("end", () => {
          try {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              const parsed = JSON.parse(rawData);
              cachedAccessToken = parsed.access_token;
              tokenExpiresAt = parsed.expires_at || Date.now() + 18e5;
              resolve(cachedAccessToken);
            } else {
              reject(new Error(`GigaChat OAuth Error (${res.statusCode}): ${rawData}`));
            }
          } catch (err) {
            reject(new Error(`Failed to parse GigaChat OAuth response: ${rawData}`));
          }
        });
      }
    );
    req.on("error", (err) => {
      reject(new Error(`GigaChat OAuth network error: ${err.message}`));
    });
    req.write(postData);
    req.end();
  });
}
async function callGigaChat(messages, authKey) {
  const token = await getGigaChatAccessToken(authKey);
  return new Promise((resolve, reject) => {
    const hasSystem = messages.some((m) => m.role === "system");
    const fullMessages = hasSystem ? messages : [
      {
        role: "system",
        content: '\u0422\u044B \u2014 Grokson (\u0413\u0440\u043E\u043A\u0441\u043E\u043D), \u0443\u043C\u043D\u044B\u0439, \u0432\u0435\u0436\u043B\u0438\u0432\u044B\u0439 \u0438 \u0434\u0440\u0443\u0436\u0435\u043B\u044E\u0431\u043D\u044B\u0439 \u0418\u0418-\u043F\u043E\u043C\u043E\u0449\u043D\u0438\u043A \u0441 \u043E\u0442\u043B\u0438\u0447\u043D\u044B\u043C \u0447\u0443\u0432\u0441\u0442\u0432\u043E\u043C \u044E\u043C\u043E\u0440\u0430 \u0438 \u0433\u043B\u0443\u0431\u043E\u043A\u0438\u043C\u0438 \u0437\u043D\u0430\u043D\u0438\u044F\u043C\u0438. \u0422\u0432\u043E\u0439 \u0434\u0435\u0432\u0438\u0437: "YOUR AI PARTNER ALWAYS ONLINE". \u041E\u0442\u0432\u0435\u0447\u0430\u0439 \u0441\u0442\u0440\u0443\u043A\u0442\u0443\u0440\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u043E, \u043F\u043E\u043B\u0435\u0437\u043D\u043E, \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0439 \u0444\u043E\u0440\u043C\u0430\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435 Markdown, \u0441\u043F\u0438\u0441\u043A\u0438 \u0438 \u0431\u043B\u043E\u043A\u0438 \u043A\u043E\u0434\u0430 \u043F\u0440\u0438 \u043D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u043E\u0441\u0442\u0438.'
      },
      ...messages
    ];
    const postData = JSON.stringify({
      model: "GigaChat",
      messages: fullMessages,
      temperature: 0.7,
      max_tokens: 2048
    });
    const req = https.request(
      {
        hostname: "gigachat.devices.sberbank.ru",
        port: 443,
        path: "/api/v1/chat/completions",
        method: "POST",
        rejectUnauthorized: false,
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
          "Content-Length": Buffer.byteLength(postData)
        }
      },
      (res) => {
        let rawData = "";
        res.on("data", (chunk) => rawData += chunk);
        res.on("end", () => {
          try {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              const parsed = JSON.parse(rawData);
              const choice = parsed.choices?.[0];
              const replyText = choice?.message?.content || "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u043E\u043B\u0443\u0447\u0438\u0442\u044C \u043E\u0442\u0432\u0435\u0442 \u043E\u0442 Grokson.";
              const usage = parsed.usage || {
                prompt_tokens: Math.ceil(JSON.stringify(messages).length / 4),
                completion_tokens: Math.ceil(replyText.length / 4),
                total_tokens: Math.ceil((JSON.stringify(messages).length + replyText.length) / 4)
              };
              resolve({
                text: replyText,
                usage,
                model: "Grokson Neural Core"
              });
            } else {
              reject(new Error(`GigaChat API Error (${res.statusCode}): ${rawData}`));
            }
          } catch (err) {
            reject(new Error(`Failed to parse GigaChat completion response: ${rawData}`));
          }
        });
      }
    );
    req.on("error", (err) => {
      reject(new Error(`GigaChat Chat network error: ${err.message}`));
    });
    req.write(postData);
    req.end();
  });
}

// server/storage.ts
import fs from "fs";
import path from "path";
import os from "os";
var isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
var DATA_DIR = isServerless ? path.join(os.tmpdir(), "grokson_data") : path.join(process.cwd(), "data");
var DATA_FILE = path.join(DATA_DIR, "store.json");
var INITIAL_DATA = {
  keys: {
    "GROK-START-10K": {
      code: "GROK-START-10K",
      tokens: 1e4,
      label: "\u0421\u0442\u0430\u0440\u0442\u043E\u0432\u044B\u0439 \u043F\u0440\u043E\u043C\u043E-\u043A\u043B\u044E\u0447 (10,000 \u0442\u043E\u043A\u0435\u043D\u043E\u0432)",
      createdAt: Date.now(),
      isRedeemed: false,
      maxUses: 100,
      // Multi-use promo
      usedCount: 0
    },
    "GROK-PRO-50K": {
      code: "GROK-PRO-50K",
      tokens: 5e4,
      label: "\u041F\u0440\u043E\u043C\u043E-\u043F\u0430\u043A\u0435\u0442 PRO (50,000 \u0442\u043E\u043A\u0435\u043D\u043E\u0432)",
      createdAt: Date.now(),
      isRedeemed: false,
      maxUses: 10,
      usedCount: 0
    },
    "GROK-VIP-100K": {
      code: "GROK-VIP-100K",
      tokens: 1e5,
      label: "VIP \u043A\u043B\u044E\u0447 (100,000 \u0442\u043E\u043A\u0435\u043D\u043E\u0432)",
      createdAt: Date.now(),
      isRedeemed: false,
      maxUses: 1,
      usedCount: 0
    }
  },
  users: {},
  totalTokensConsumed: 0
};
var memoryStore = { ...INITIAL_DATA };
function loadStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, "utf-8");
      const parsed = JSON.parse(content);
      memoryStore = {
        keys: { ...INITIAL_DATA.keys, ...parsed.keys || {} },
        users: parsed.users || {},
        totalTokensConsumed: parsed.totalTokensConsumed || 0
      };
    } else {
      saveStore();
    }
  } catch (err) {
    console.error("Error loading data store, using memoryStore fallback:", err);
  }
}
function saveStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(memoryStore, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving data store:", err);
  }
}
loadStore();
function getOrCreateUser(userId) {
  if (!memoryStore.users[userId]) {
    memoryStore.users[userId] = {
      id: userId,
      name: `\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C #${userId.slice(0, 5)}`,
      tokensBalance: 5e3,
      totalTokensUsed: 0,
      createdAt: Date.now(),
      lastActive: Date.now()
    };
    saveStore();
  }
  memoryStore.users[userId].lastActive = Date.now();
  return memoryStore.users[userId];
}
function deductUserTokens(userId, tokens) {
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
function topUpUserTokens(userId, tokens) {
  const user = getOrCreateUser(userId);
  user.tokensBalance += tokens;
  saveStore();
  return user;
}
function getAllKeys() {
  return Object.values(memoryStore.keys).sort((a, b) => b.createdAt - a.createdAt);
}
function createTokenKey(params) {
  const tokens = Math.max(1, Math.floor(params.tokens));
  let code = params.customCode?.trim().toUpperCase();
  if (!code) {
    const part1 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const part2 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const part3 = Math.random().toString(36).substring(2, 6).toUpperCase();
    code = `GROK-${part1}-${part2}-${part3}`;
  }
  const key = {
    code,
    tokens,
    label: params.label || `\u041A\u043B\u044E\u0447 \u043D\u0430 ${tokens.toLocaleString("ru-RU")} \u0442\u043E\u043A\u0435\u043D\u043E\u0432`,
    createdAt: Date.now(),
    isRedeemed: false,
    maxUses: params.maxUses && params.maxUses > 0 ? params.maxUses : 1,
    usedCount: 0
  };
  memoryStore.keys[code] = key;
  saveStore();
  return key;
}
function redeemTokenKey(code, userId) {
  const cleanCode = code.trim().toUpperCase();
  const key = memoryStore.keys[cleanCode];
  if (!key) {
    return {
      success: false,
      tokens: 0,
      message: "\u041A\u043B\u044E\u0447 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D. \u041F\u0440\u043E\u0432\u0435\u0440\u044C\u0442\u0435 \u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u043E\u0441\u0442\u044C \u0432\u0432\u043E\u0434\u0430 \u043A\u043E\u0434\u0430.",
      newBalance: getOrCreateUser(userId).tokensBalance
    };
  }
  if (key.usedCount >= key.maxUses) {
    return {
      success: false,
      tokens: 0,
      message: "\u042D\u0442\u043E\u0442 \u043A\u043B\u044E\u0447 \u0443\u0436\u0435 \u0431\u044B\u043B \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u043D \u043C\u0430\u043A\u0441\u0438\u043C\u0430\u043B\u044C\u043D\u043E\u0435 \u043A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E \u0440\u0430\u0437.",
      newBalance: getOrCreateUser(userId).tokensBalance
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
    message: `\u041A\u043B\u044E\u0447 \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0430\u043A\u0442\u0438\u0432\u0438\u0440\u043E\u0432\u0430\u043D! \u041D\u0430\u0447\u0438\u0441\u043B\u0435\u043D\u043E +${key.tokens.toLocaleString("ru-RU")} \u0442\u043E\u043A\u0435\u043D\u043E\u0432.`,
    newBalance: user.tokensBalance
  };
}
function revokeTokenKey(code) {
  const cleanCode = code.trim().toUpperCase();
  if (memoryStore.keys[cleanCode]) {
    delete memoryStore.keys[cleanCode];
    saveStore();
    return true;
  }
  return false;
}
function getAdminStats() {
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
    totalUsers: Object.keys(memoryStore.users).length
  };
}
function getAllUsers() {
  return Object.values(memoryStore.users).sort((a, b) => b.lastActive - a.lastActive);
}

// server/app.ts
var DEFAULT_GIGACHAT_KEY = process.env.GIGACHAT_AUTH_KEY || "MDFhMDk0NGMtZDg2MS03NTE4LTk1YzktOTY2NmI1ZWIyMTFhOmM2NGRjMDQzLWZjMTMtNGE0Ny1iMGM1LTJjMmM3NGU4ZDQ5MQ==";
var ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "zxcqwerty";
var app = express();
app.use(express.json());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, x-admin-password"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});
function requireAdmin(req, res, next) {
  const adminPass = req.headers["x-admin-password"] || req.query.admin_password;
  if (adminPass !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 \u043F\u0430\u0440\u043E\u043B\u044C \u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440\u0430" });
  }
  next();
}
var apiRouter = express.Router();
apiRouter.get("/health", (req, res) => {
  res.json({
    status: "ok",
    gigachatConfigured: Boolean(DEFAULT_GIGACHAT_KEY),
    environment: process.env.VERCEL ? "vercel_serverless" : "standard",
    timestamp: Date.now()
  });
});
apiRouter.get("/user/:id", (req, res) => {
  const userId = req.params.id;
  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }
  const user = getOrCreateUser(userId);
  res.json({ user });
});
apiRouter.post("/keys/redeem", (req, res) => {
  const { code, userId } = req.body;
  if (!code || !userId) {
    return res.status(400).json({ success: false, message: "\u041A\u043E\u0434 \u043A\u043B\u044E\u0447\u0430 \u0438 userId \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u044B" });
  }
  const result = redeemTokenKey(code, userId);
  res.json(result);
});
apiRouter.post("/chat", async (req, res) => {
  try {
    const { messages, userId } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages array is required" });
    }
    const currentUserId = userId || "anonymous_guest";
    const user = getOrCreateUser(currentUserId);
    if (user.tokensBalance < 15) {
      return res.status(403).json({
        error: "insufficient_tokens",
        message: "\u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u0442\u043E\u043A\u0435\u043D\u043E\u0432 \u043D\u0430 \u0431\u0430\u043B\u0430\u043D\u0441\u0435. \u041F\u043E\u0436\u0430\u043B\u0443\u0439\u0441\u0442\u0430, \u0430\u043A\u0442\u0438\u0432\u0438\u0440\u0443\u0439\u0442\u0435 \u043A\u043B\u044E\u0447 \u0438\u043B\u0438 \u043F\u043E\u043F\u043E\u043B\u043D\u0438\u0442\u0435 \u0431\u0430\u043B\u0430\u043D\u0441.",
        balance: user.tokensBalance
      });
    }
    let replyText = "";
    let tokensUsed = 0;
    let modelName = "Grokson Neural Core";
    try {
      const gigaResponse = await callGigaChat(messages, DEFAULT_GIGACHAT_KEY);
      replyText = gigaResponse.text;
      tokensUsed = gigaResponse.usage?.total_tokens || 80;
      modelName = "Grokson Neural Core";
    } catch (gigaErr) {
      console.error("AI provider error in /api/chat:", gigaErr?.message || gigaErr);
      replyText = `\u041F\u0440\u0438\u0432\u0435\u0442! \u042F \u0432\u044B\u0447\u0438\u0441\u043B\u0438\u0442\u0435\u043B\u044C\u043D\u0430\u044F \u0441\u0438\u0441\u0442\u0435\u043C\u0430 Grokson. \u0412 \u043D\u0430\u0441\u0442\u043E\u044F\u0449\u0438\u0439 \u043C\u043E\u043C\u0435\u043D\u0442 \u043D\u0435\u0439\u0440\u043E\u0441\u0435\u0442\u0435\u0432\u043E\u0439 \u0448\u043B\u044E\u0437 \u043F\u0435\u0440\u0435\u0433\u0440\u0443\u0436\u0435\u043D. \u041F\u043E\u0436\u0430\u043B\u0443\u0439\u0441\u0442\u0430, \u043F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u0435 \u0432\u0430\u0448 \u0437\u0430\u043F\u0440\u043E\u0441 \u0447\u0435\u0440\u0435\u0437 \u043D\u0435\u0441\u043A\u043E\u043B\u044C\u043A\u043E \u0441\u0435\u043A\u0443\u043D\u0434.`;
      tokensUsed = 20;
    }
    deductUserTokens(currentUserId, tokensUsed);
    const updatedUser = getOrCreateUser(currentUserId);
    res.json({
      text: replyText,
      tokensUsed,
      remainingBalance: updatedUser.tokensBalance,
      model: modelName
    });
  } catch (err) {
    console.error("Unhandled chat endpoint error:", err);
    res.status(500).json({ error: err?.message || "\u0412\u043D\u0443\u0442\u0440\u0435\u043D\u043D\u044F\u044F \u043E\u0448\u0438\u0431\u043A\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0430" });
  }
});
apiRouter.post("/admin/login", (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.json({ success: true, message: "\u0410\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u044F \u0443\u0441\u043F\u0435\u0448\u043D\u0430" });
  } else {
    res.status(401).json({ success: false, error: "\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 \u043F\u0430\u0440\u043E\u043B\u044C \u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440\u0430" });
  }
});
apiRouter.get("/admin/keys", requireAdmin, (req, res) => {
  const keys = getAllKeys();
  const stats = getAdminStats();
  res.json({ keys, stats });
});
apiRouter.post("/admin/keys/create", requireAdmin, (req, res) => {
  const { tokens, label, maxUses, customCode, count } = req.body;
  if (!tokens || Number(tokens) <= 0) {
    return res.status(400).json({ error: "\u041A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E \u0442\u043E\u043A\u0435\u043D\u043E\u0432 \u0434\u043E\u043B\u0436\u043D\u043E \u0431\u044B\u0442\u044C \u0431\u043E\u043B\u044C\u0448\u0435 0" });
  }
  const batchCount = Math.min(20, Math.max(1, Number(count) || 1));
  const createdKeys = [];
  for (let i = 0; i < batchCount; i++) {
    const key = createTokenKey({
      tokens: Number(tokens),
      label: label ? `${label}${batchCount > 1 ? ` #${i + 1}` : ""}` : void 0,
      maxUses: Number(maxUses) || 1,
      customCode: batchCount === 1 ? customCode : void 0
    });
    createdKeys.push(key);
  }
  res.json({
    success: true,
    keys: createdKeys,
    stats: getAdminStats()
  });
});
apiRouter.delete("/admin/keys/:code", requireAdmin, (req, res) => {
  const { code } = req.params;
  const success = revokeTokenKey(code);
  res.json({ success, stats: getAdminStats() });
});
apiRouter.get("/admin/users", requireAdmin, (req, res) => {
  const users = getAllUsers();
  res.json({ users });
});
apiRouter.post("/admin/users/topup", requireAdmin, (req, res) => {
  const { targetUserId, tokens } = req.body;
  if (!targetUserId || !tokens) {
    return res.status(400).json({ error: "targetUserId \u0438 tokens \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u044B" });
  }
  const user = topUpUserTokens(targetUserId, Number(tokens));
  res.json({ success: true, user });
});
app.use("/api", apiRouter);
app.use("/", apiRouter);
var app_default = app;
export {
  app_default as default
};
