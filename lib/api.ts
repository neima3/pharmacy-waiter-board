export type ApiResponse<T> = { success: true; data: T } | { success: false; error: string; fields?: Record<string, string> }

export async function apiFetch<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)

  try {
    const res = await fetch(url, { ...options, signal: controller.signal })
    clearTimeout(timeout)
    const data = await res.json()

    if (!res.ok) {
      return {
        success: false,
        error: data.error || `Request failed (${res.status})`,
        fields: data.fields,
      }
    }
    return { success: true, data: data as T }
  } catch (err) {
    clearTimeout(timeout)
    if (err instanceof DOMException && err.name === 'AbortError') {
      return { success: false, error: 'Request timed out' }
    }
    return { success: false, error: err instanceof Error ? err.message : 'Network error' }
  }
}
