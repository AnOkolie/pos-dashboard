import { api } from "../../lib/api";

export async function inventoryLoader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const productName = url.searchParams.get("productName") ?? "";

  if (!productName.trim()) {
    return { productName: "", results: [] };
  }

  const data = await api.inventoryByName(productName);
  return { productName, results: data.results ?? [] };
}
