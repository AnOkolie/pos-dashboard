import { api } from "../../lib/api";
import { resolveCustomerByName } from "../../lib/customer";

export async function customerAction({ request }: { request: Request }) {
  const form = await request.formData();
  const queryName = String(form.get("customerName") ?? "").trim();
  if (!queryName) throw new Error("customerName is required");

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
