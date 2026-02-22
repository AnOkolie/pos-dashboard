import { api } from "./api";

export const resolveCustomerByName = async (customerName: string) => {
  const search = await api.customerSearch(customerName);
  const best = search.results?.[0];
  if (!best?.id) throw new Error("No matching customer found");
  const id = Number(best.id);
  if (!Number.isFinite(id)) throw new Error("Invalid customer id");
  return id;
};
