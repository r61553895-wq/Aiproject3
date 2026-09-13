export interface UserSession {
  id: string;
  name: string;
  tokensBalance: number;
  totalTokensUsed: number;
  createdAt: number;
  lastActive: number;
}

export interface TokenKey {
  code: string;
  tokens: number;
  label: string;
  createdAt: number;
  isRedeemed: boolean;
  redeemedAt?: number;
  redeemedBy?: string;
  maxUses: number;
  usedCount: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  tokensUsed?: number;
  model?: string;
  error?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface AdminStats {
  totalKeys: number;
  activeKeys: number;
  redeemedKeys: number;
  totalTokensIssued: number;
  totalTokensRedeemed: number;
  totalTokensConsumed: number;
  totalUsers: number;
}
