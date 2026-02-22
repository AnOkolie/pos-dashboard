import { api } from "../../lib/api";

export async function salesTodayLoader() {
  const data = await api.salesToday();
  return { data };
}
