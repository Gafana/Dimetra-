declare global {
  namespace Express {
    interface Request {
      telegramChatId?: string;
    }
  }
}

export {};
