export async function safeFetchJson<T = any>(path: string, opts?: RequestInit, fallback: T | null = null): Promise<T | null> {
  try {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return fallback;

    // Build request options with timeout/abort support
    const baseOptsNoSignal: RequestInit = { cache: 'no-store', credentials: 'same-origin', ...opts } as RequestInit;

    // Helper to safely perform fetch and return parsed JSON or null using per-request AbortController
    async function tryFetch(url: string): Promise<T | null> {
      // Use Promise.race to implement a timeout without aborting the fetch (avoids AbortError noise)
      const fetchPromise = (async () => {
        try {
          const res = await fetch(url, { ...baseOptsNoSignal } as RequestInit);
          if (!res.ok) return null;
          return (await res.json()) as T;
        } catch (e) {
          return null;
        }
      })();

      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000));
      try {
        return (await Promise.race([fetchPromise, timeoutPromise])) as T | null;
      } catch {
        return null;
      }
    }

    // If in browser and path is absolute-rooted (starts with '/'), try relative first to avoid cross-origin issues in some previews
    if (typeof window !== 'undefined' && path.startsWith('/')) {
      // Try relative path first
      const relResult = await tryFetch(path);
      if (relResult !== null) return relResult;

      // Then try absolute origin
      const absolute = `${window.location.origin}${path}`;
      const absResult = await tryFetch(absolute);
      if (absResult !== null) return absResult;

      // Try Netlify function proxy patterns for packaged deployments
      if (path.startsWith('/api/')) {
        const nfRel = path.replace('/api/', '/.netlify/functions/api/');
        const nfResult = await tryFetch(nfRel);
        if (nfResult !== null) return nfResult;
        const nfAbsolute = `${window.location.origin}${nfRel}`;
        const nfAbsResult = await tryFetch(nfAbsolute);
        if (nfAbsResult !== null) return nfAbsResult;
      }

      return fallback;
    }

    // Not a slash path or not in browser - just try fetch as given
    const direct = await tryFetch(path);
    if (direct !== null) return direct;
    return fallback;
  } catch {
    return fallback;
  }
}
