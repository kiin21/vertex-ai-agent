export interface StreamCallback {
  (data: {
    content: string;
    finishReason?: string;
    usageMetadata?: Record<string, any>;
    invocationId: string;
    author: string;
    timestamp: number;
  }): void;
}

export interface ExternalSessionEvent {
  id: string;
  invocationId?: string;
  role?: string;
  author?: string;
  content?: {
    role?: string;
    parts?: Array<{
      text?: string;
      thoughtSignature?: string;
      thought_signature?: string;
    }>;
    text?: string;
  };
  customMetadata?: Record<string, any>;
  actions?: Record<string, any>;
  finishReason?: string;
  finish_reason?: string;
  usageMetadata?: Record<string, any>;
  usage_metadata?: Record<string, any>;
  timestamp?: number;
  turnComplete?: boolean;
  errorMessage?: string;
  errorCode?: string;
}

export interface ExternalSession {
  id: string;
  lastUpdateTime: number;
  state: Record<string, any>;
  appName: string;
  userId: string;
  events: ExternalSessionEvent[];
}
