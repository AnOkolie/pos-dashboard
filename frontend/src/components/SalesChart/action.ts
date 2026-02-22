import { api } from "../../lib/api";

export async function salesTodayAction({ request }: { request: Request }) {
  const form = await request.formData();
  const intent = String(form.get("intent") ?? "");
  if (intent !== "refresh") return null;

  const data = await api.salesToday();
  return { data };
}
