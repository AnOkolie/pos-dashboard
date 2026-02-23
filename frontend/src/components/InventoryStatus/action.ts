import { api } from "../../lib/api";

export async function inventoryAction({ request }: { request: Request }) {
  const form = await request.formData();
  const productName = String(form.get("productName") ?? "").trim();
  if (!productName) throw new Error("productName is required");

  // Return data directly so Tambo can render immediately
  const data = await api.inventoryByName(productName);
  return { productName, results: data.results ?? [] };
}
