// Calls the "app" Edge Function (supabase/functions/app). Every write that matters goes through here.
export class ApiError extends Error {
  constructor(public code: string, public status: number) {
    super(code);
  }
  /** No signal or the server didn't answer: worth retrying later (the offline queue does). */
  get retryable(): boolean {
    return this.status === 0 || this.status >= 500;
  }
}

export type AppApi = <T = unknown>(action: string, body: Record<string, unknown>) => Promise<T>;

export function createAppApi(opts: { functionsUrl: string; getToken: () => Promise<string | null>; fetch?: typeof fetch }): AppApi {
  const doFetch = opts.fetch ?? fetch;
  return async <T,>(action: string, body: Record<string, unknown>) => {
    const token = await opts.getToken();
    if (!token) throw new ApiError('not_logged_in', 401);
    let res: Response;
    try {
      res = await doFetch(`${opts.functionsUrl.replace(/\/$/, '')}/app/${action}`, {
        method: 'POST',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch {
      throw new ApiError('offline', 0);
    }
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) throw new ApiError(data.error ?? 'server_error', res.status);
    return data as T;
  };
}
