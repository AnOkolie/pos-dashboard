const CART_KEY = "pos_cart_id";

function getSavedCartId(): number | null {
  const raw = localStorage.getItem(CART_KEY);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function saveCartId(id: number) {
  localStorage.setItem(CART_KEY, String(id));
}

async function createCart(): Promise<number> {
  const res = await fetch("/api/cart", { method: "POST" });
  if (!res.ok) throw new Error("Failed to create cart");
  const data = await res.json();

  // handle different possible shapes from backend
  const id =
    data.cartId ??
    data.cart_id ??
    data.id ??
    data?.data?.id ??
    data?.data?.cartId;

  const num = Number(id);
  if (!Number.isFinite(num))
    throw new Error("Create cart did not return a cart id");

  saveCartId(num);
  return num;
}

export async function cartLoader() {
  let cartId = getSavedCartId();

  if (!cartId) {
    cartId = await createCart();
  }

  const res = await fetch(`/api/cart/${cartId}`);
  if (!res.ok) throw new Error("Failed to load cart");
  return res.json();
}
