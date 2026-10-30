import axios from 'axios';

export function getApiErrorMessage(error: unknown, fallback = 'Не удалось выполнить запрос'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string } | undefined;
    if (data?.error) {
      return data.error;
    }
    if (error.response?.status === 401) {
      return 'Откройте приложение через Telegram, чтобы выполнить это действие.';
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
