const KEY = "pos_cart_id";

export const getSavedCartId = (): number | null => {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
};

export const saveCartId = (id: number) => {
  localStorage.setItem(KEY, String(id));
};

export const clearCartId = () => {
  localStorage.removeItem(KEY);
};

export const getOrCreateCartId = async (branchId = 1, customerId?: number) => {
  let cartId = getSavedCartId();
  if (cartId) return cartId;

  const res = await fetch("/api/cart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ branchId, customerId }),
  });

  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();

  cartId = data.id;
  if (!cartId) throw new Error("Cart create returned no id");
  saveCartId(cartId);

  return cartId;
};

export const ensureActiveCartId = async (branchId = 1): Promise<number> => {
  const saved = getSavedCartId();
  if (!saved) {
    // no cart -> create
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ branchId }),
    });
    const data = await res.json();
    const id = data?.id;
    if (!id) throw new Error("Create cart returned no id");
    saveCartId(id);
    return id;
  }

  // check status
  const cartRes = await fetch(`/api/cart/${saved}`);
  if (!cartRes.ok) {
    // cart missing -> create
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ branchId }),
    });
    const data = await res.json();
    const id = data?.id;
    if (!id) throw new Error("Create cart returned no id");
    saveCartId(id);
    return id;
  }

  const cart = await cartRes.json();
  if (cart.status === "checked_out") {
    // checked out -> create new
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ branchId }),
    });
    const data = await res.json();
    const id = data?.id;
    if (!id) throw new Error("Create cart returned no id");
    saveCartId(id);
    return id;
  }

  return saved;
};
