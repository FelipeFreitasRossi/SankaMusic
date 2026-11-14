/**
 * Cliente HTTP mínimo (fetch) com:
 * - URL base configurável (VITE_API_URL)
 * - token JWT automático
 * - erros padronizados (ApiError)
 * - cancelamento via AbortSignal
 */

export const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || '/api';

const TOKEN_KEY = 'sanka.token';

export const tokenStore = {
  get: (): string | null => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (t: string) => {
    try {
      localStorage.setItem(TOKEN_KEY, t);
    } catch {
      /* armazenamento indisponível */
    }
  },
  clear: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* noop */
    }
  },
};

export interface FieldError {
  field: string;
  message: string;
}

export class ApiError extends Error {
  status: number;
  code?: string;
  errors?: FieldError[];
  data?: Record<string, unknown>;

  constructor(message: string, status: number, code?: string, errors?: FieldError[], data?: Record<string, unknown>) {
    super(message);
    this.status = status;
    this.code = code;
    this.errors = errors;
    this.data = data;
  }
}

type Query = Record<string, string | number | boolean | undefined | null | (string | number)[]>;

interface RequestOptions {
  method?: string;
  body?: unknown;
  query?: Query;
  signal?: AbortSignal;
  auth?: boolean;
}

let unauthorizedHandler: (() => void) | null = null;
export function onUnauthorized(handler: () => void) {
  unauthorizedHandler = handler;
}

export function buildQuery(query?: Query): string {
  if (!query) return '';
  const params = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    if (Array.isArray(v)) v.forEach((item) => params.append(k, String(item)));
    else params.append(k, String(v));
  });
  const s = params.toString();
  return s ? `?${s}` : '';
}

export async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  const token = tokenStore.get();
  if (token && opts.auth !== false) headers.Authorization = `Bearer ${token}`;

  let body: BodyInit | undefined;
  if (opts.body instanceof FormData) {
    body = opts.body;
  } else if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(opts.body);
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}${buildQuery(opts.query)}`, {
      method: opts.method || 'GET',
      headers,
      body,
      signal: opts.signal,
    });
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err;
    throw new ApiError('Não foi possível conectar ao servidor. Verifique sua conexão.', 0, 'network_error');
  }

  if (res.status === 204) return undefined as T;

  let data: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const d = (data || {}) as { detail?: string; code?: string; errors?: FieldError[] };
    if (res.status === 401 && token && unauthorizedHandler) unauthorizedHandler();
    throw new ApiError(
      d.detail || defaultMessage(res.status),
      res.status,
      d.code,
      d.errors,
      data as Record<string, unknown>,
    );
  }
  return data as T;
}

function defaultMessage(status: number): string {
  if (status === 404) return 'Recurso não encontrado.';
  if (status === 403) return 'Você não tem permissão para esta ação.';
  if (status === 429) return 'Muitas tentativas. Aguarde um pouco.';
  if (status >= 500) return 'Erro no servidor. Tente novamente em instantes.';
  return 'Não foi possível concluir a operação.';
}

export const api = {
  get: <T>(path: string, query?: Query, signal?: AbortSignal) => request<T>(path, { query, signal }),
  post: <T>(path: string, body?: unknown, query?: Query) => request<T>(path, { method: 'POST', body, query }),
  put: <T>(path: string, body?: unknown, query?: Query) => request<T>(path, { method: 'PUT', body, query }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  del: <T = void>(path: string) => request<T>(path, { method: 'DELETE' }),
};

/** Mensagem amigável para qualquer erro */
export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.errors?.length) return err.errors.map((e) => e.message.replace(/^Value error, /, '')).join(' ');
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return 'Ocorreu um erro inesperado.';
}
