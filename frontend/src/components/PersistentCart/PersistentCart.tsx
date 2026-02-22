import { useState, useEffect } from "react";
import { getSavedCartId } from "../../lib/cartSession";

export const PersistentCart = () => {
  const [cart, setCart] = useState<any | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function refresh() {
    try {
      let cartId = getSavedCartId();

      if (!cartId) {
        const created = await fetch(`/api/cart`, { method: "POST" });
        const data = await created.json();
        cartId = data.id;
        localStorage.setItem("cartId", String(cartId));
      }

      const res = await fetch(`/api/cart/${cartId}`);
      if (!res.ok) throw new Error(await res.text());

      setCart(await res.json());
    } catch (e: any) {
      setErr(e.message);
    }
  }

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 1500);
    return () => clearInterval(t);
  }, []);

  if (err) return <div>Error: {err}</div>;
  if (!cart) return <div>Loading cart…</div>;

  return (
    <div>
      <h2>Cart #{cart.id}</h2>

      {cart.items?.length ? (
        cart.items.map((item: any) => (
          <div key={item.productId}>
            {item.productName} — {item.quantity}
          </div>
        ))
      ) : (
        <div>Your cart is empty.</div>
      )}
    </div>
  );
};
