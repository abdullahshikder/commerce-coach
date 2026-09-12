export async function withTransientProviderRetry<T>(request: () => Promise<T>): Promise<T> {
  try {
    return await request();
  } catch (error) {
    const failure = error as { name?: string; status?: number } | null;
    const transient = failure && (['TimeoutError', 'AbortError', 'TypeError'].includes(failure.name ?? '')
      || [408, 500, 502, 503, 504].includes(failure.status ?? 0));
    if (!transient) throw error;
    // These calls generate text only. Retry transient transport failures once, never tool execution.
    console.warn(JSON.stringify({ event: 'provider_transient_retry' }));
    return request();
  }
}
