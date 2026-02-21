const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }

  return (await res.json()) as T;
}

export const api = {
  // Inventory
  inventoryByName: (name: string) =>
    request<{ query: string; results: any[] }>(
      `/api/inventory/products?name=${encodeURIComponent(name)}`,
    ),

  // Customers
  customerSearch: (name: string) =>
    request<{ results: any[] }>(
      `/api/customers/search?name=${encodeURIComponent(name)}`,
    ),
  customerById: (id: number) => request<any>(`/api/customers/${id}`),
  customerHistory: (id: number) => request<any>(`/api/customers/${id}/history`),

  // Sales today
  salesToday: () => request<any>(`/api/reports/sales/today`),

  // Cart
  createCart: () => request<any>(`/api/cart`, { method: "POST" }),
  getCart: (id: number) => request<any>(`/api/cart/${id}`),
  updateCart: (id: number, body: unknown) =>
    request<any>(`/api/cart/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  checkout: (id: number) =>
    request<any>(`/api/cart/${id}/checkout`, { method: "POST" }),
};
