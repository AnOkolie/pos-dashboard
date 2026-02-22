import { useLoaderData, Form } from "react-router-dom";

type CartItem = {
  productId: string;
  productName: string;
  quantity: number;
};

type CartData = {
  cartId: number;
  items: CartItem[];
};

export const PersistentCart = () => {
  const cart = useLoaderData() as CartData;

  if (!cart) {
    return <div>Loading cart...</div>;
  }

  return (
    <div>
      <h2>Cart #{cart.cartId}</h2>

      {cart.items?.length ? (
        cart.items.map((item) => (
          <div key={item.productId}>
            {item.productName} — {item.quantity}
          </div>
        ))
      ) : (
        <div>Your cart is empty.</div>
      )}

      <Form method="post" style={{ marginTop: 12 }}>
        <input type="hidden" name="intent" value="add" />
        <input name="productName" placeholder="Product name (e.g., Espresso)" />
        <input name="quantity" type="number" min={1} defaultValue={1} />
        <button type="submit">Add</button>
      </Form>
    </div>
  );
};
