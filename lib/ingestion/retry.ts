const retryableStatuses = new Set([429, 500, 502, 503, 504]);

export function isRetryableError(error: unknown): boolean {
  if (error instanceof Error && error.name === "TimeoutError") return true;
  const status = typeof error === "object" && error !== null && "status" in error ? Number(error.status) : 0;
  return retryableStatuses.has(status);
}

export async function withRetry<T>(operation: (attempt: number) => Promise<T>, maxAttempts = 4): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await operation(attempt);
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts || !isRetryableError(error)) throw error;
      await new Promise((resolve) => setTimeout(resolve, 250 * 2 ** (attempt - 1)));
    }
  }
  throw lastError;
}