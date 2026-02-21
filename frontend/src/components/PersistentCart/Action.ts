export async function cartAction({ request, params }) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "add") {
    return fetch(`/api/cart/${params.cartId}`, {
      method: "POST",
      body: formData,
    });
  }

  if (intent === "checkout") {
    return fetch(`/api/cart/${params.cartId}/checkout`, {
      method: "POST",
    });
  }

  return null;
}
