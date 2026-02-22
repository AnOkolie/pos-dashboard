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

export async function getOrCreateCartId(customerId: string) {
  let cartId = localStorage.getItem("cartId");

  if (!cartId) {
    const res = await fetch("/api/carts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId }),
    });

    const data = await res.json();
    cartId = data.cartId;
    if (cartId) localStorage.setItem("cartId", cartId);
  }

  return cartId;
}
