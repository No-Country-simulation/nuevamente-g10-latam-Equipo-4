export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api/atlas/${path}`, {...options, headers: options?.body instanceof FormData ? options.headers : {'Content-Type': 'application/json', ...options?.headers}, cache: 'no-store'});
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(typeof body.error === 'string' ? body.error : typeof body.message === 'string' ? body.message : `A solicitação falhou (${response.status}). Tente novamente.`);
  }
  return response.json();
}
export const post = <T>(path: string, value: unknown) => api<T>(path, {method: 'POST', body: JSON.stringify(value)});
