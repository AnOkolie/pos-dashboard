import { useLoaderData, Form } from "react-router-dom";

export const PersistentCart = () => {
  const cart = useLoaderData();
  type itemStructure = {
    productId: string;
    productName: string;
    quantity: number;
  };
  return (
    <div>
      <h2>Cart #{cart.cartId}</h2>

      {cart.items.map((item: itemStructure) => (
        <div key={item.productId}>
          {item.productName} — {item.quantity}
        </div>
      ))}

      <Form method="post">
        <input type="hidden" name="intent" value="checkout" />
        <button>Checkout</button>
      </Form>
    </div>
  );
};
