import { useState, useEffect } from "react";
import { getSavedCartId, saveCartId } from "../../lib/cartSession";

export const PersistentCart = () => {
  const [cart, setCart] = useState<any | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function refresh() {
    try {
      let cartId = getSavedCartId();

      if (!cartId) {
        const created = await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ branchId: 1 }),
        });
        const data = await created.json();
        cartId = data.id;
        if (cartId) {
          saveCartId(cartId);
        }
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
      <h2>Cart #{cart.cartId}</h2>
      {cart.status === "checked_out" && (
        <div style={{ marginTop: 8, padding: 8, background: "#ecfdf5" }}>
          Checked out
        </div>
      )}
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
