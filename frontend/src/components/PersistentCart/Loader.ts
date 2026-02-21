type param = {
  cartId: string;
};

export async function cartLoader() {
  const cartId = 1;
  const res = await fetch(`/api/cart/${cartId}`);
  if (!res.ok) throw new Error("Failed to load cart");
  return res.json();
}
