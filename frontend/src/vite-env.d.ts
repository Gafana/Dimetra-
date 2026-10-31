/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Production API origin (build-time). Empty = same origin as Mini App (nginx /api proxy). */
  readonly VITE_API_URL?: string;
  /** @deprecated use VITE_API_URL */
  readonly VITE_API_BASE_URL?: string;
  /** Browser local dev (no Telegram Mini App) */
  readonly VITE_LOCAL_DEV?: string;
  readonly VITE_LOCAL_DEV_CHAT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
