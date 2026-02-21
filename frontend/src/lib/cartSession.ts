const KEY = "pos_cart_id";

export function getSavedCartId(): number | null {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function saveCartId(id: number) {
  localStorage.setItem(KEY, String(id));
}

export function clearCartId() {
  localStorage.removeItem(KEY);
}
