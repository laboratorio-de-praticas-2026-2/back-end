// Cliente HTTP único: todas as chamadas à API passam por aqui.
export class ApiError extends Error {
  /**
   * @param {'network'|'timeout'|'http'|'parse'|'aborted'} kind
   */
  constructor(kind, message, { status, details } = {}) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
    this.details = details;
  }
}

/** Mensagem segura para o usuário; detalhes técnicos ficam em error.details / console. */
export function toUserMessage(error, fallback = 'Não foi possível concluir a operação.') {
  if (!(error instanceof ApiError)) return fallback;
  switch (error.kind) {
    case 'network':
      return 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.';
    case 'timeout':
      return 'O servidor demorou demais para responder. Tente novamente.';
    case 'parse':
      return 'O servidor retornou uma resposta inesperada.';
    case 'http':
      if (error.status === 400 || error.status === 422) return error.message || 'Dados inválidos.';
      if (error.status === 401 || error.status === 403) return 'Você não tem permissão para realizar esta ação.';
      if (error.status === 404) return error.message || 'Recurso não encontrado.';
      if (error.status >= 500) return 'Erro interno do servidor. Tente novamente em instantes.';
      return error.message || fallback;
    default:
      return fallback;
  }
}

function extractMessage(body) {
  if (!body || typeof body !== 'object') return undefined;
  const m = body.message;
  if (Array.isArray(m)) return m.join(' ');
  return typeof m === 'string' ? m : undefined;
}

export function createHttpClient({ baseUrl = '', timeoutMs = 30000, fetchImpl, getToken, logger = console } = {}) {
  const doFetch = fetchImpl ?? ((...a) => globalThis.fetch(...a));

  async function raw(path, { method = 'GET', query, body, signal, headers = {}, timeout = timeoutMs } = {}) {
    const url = new URL(`${baseUrl}${path}`, globalThis.location?.origin ?? 'http://localhost');
    for (const [k, v] of Object.entries(query ?? {})) {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
    }

    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeout);
    const onAbort = () => controller.abort();
    signal?.addEventListener('abort', onAbort);

    const finalHeaders = { Accept: 'application/json', ...headers };
    if (body !== undefined) finalHeaders['Content-Type'] = 'application/json';
    const token = getToken?.();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;

    try {
      const response = await doFetch(url.toString(), {
        method,
        headers: finalHeaders,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      if (!response.ok) {
        let parsed;
        try {
          parsed = await response.json();
        } catch {
          /* corpo não-JSON */
        }
        const error = new ApiError('http', extractMessage(parsed) ?? `Erro HTTP ${response.status}`, {
          status: response.status,
          details: parsed,
        });
        logger.error?.(`[api] ${method} ${path} -> ${response.status}`, parsed);
        throw error;
      }
      return response;
    } catch (err) {
      if (err instanceof ApiError) throw err;
      if (timedOut) {
        logger.error?.(`[api] timeout ${method} ${path}`);
        throw new ApiError('timeout', 'Tempo limite excedido');
      }
      if (err?.name === 'AbortError') throw new ApiError('aborted', 'Requisição cancelada');
      logger.error?.(`[api] falha de rede ${method} ${path}`, err);
      throw new ApiError('network', 'Falha de conexão', { details: err });
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
    }
  }

  async function json(path, options) {
    const response = await raw(path, options);
    try {
      return await response.json();
    } catch (err) {
      logger.error?.(`[api] resposta não-JSON em ${path}`, err);
      throw new ApiError('parse', 'Resposta inválida', { details: err });
    }
  }

  return { raw, json };
}
