import { api } from "../../lib/api";
import { resolveCustomerByName } from "../../lib/customer";

export async function customerLoader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const queryName = url.searchParams.get("customerName") ?? "";

  if (!queryName.trim()) {
    return { queryName: "", customer: null, history: null, error: null };
  }

  try {
    const id = await resolveCustomerByName(queryName);
    const [customer, history] = await Promise.all([
      api.customerById(id),
      api.customerHistory(id),
    ]);
    return { queryName, customer, history, error: null };
  } catch (e: any) {
    return {
      queryName,
      customer: null,
      history: null,
      error: e.message ?? "Error",
    };
  }
}
