const CART_KEY = "pos_cart_id";

function getSavedCartId(): number | null {
  const raw = localStorage.getItem(CART_KEY);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function clearCartId() {
  localStorage.removeItem(CART_KEY);
}

export async function cartAction({ request }: { request: Request }) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  const cartId = getSavedCartId();
  if (!cartId) throw new Error("No active cart session");

  if (intent === "add") {
    // IMPORTANT: backend expects PUT /api/cart/:id (updateCart)
    // Convert the formData into JSON the backend can understand.
    const productName = String(formData.get("productName") ?? "");
    const quantity = Number(formData.get("quantity") ?? 0);

    if (!productName.trim() || !Number.isFinite(quantity) || quantity <= 0) {
      throw new Error("productName and positive quantity are required");
    }

    return fetch(`/api/cart/${cartId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productName, quantity }),
    });
  }

  if (intent === "checkout") {
    const res = await fetch(`/api/cart/${cartId}/checkout`, { method: "POST" });
    if (!res.ok) throw new Error("Checkout failed");
    clearCartId();
    return res;
  }

  return null;
}
