import { Form, useLoaderData, useNavigation } from "react-router-dom";

type InventoryRow = {
  productId?: number;
  productName?: string;
  branchId?: number;
  branchName?: string;
  quantity: number;
};

type LoaderData = {
  productName: string;
  results: InventoryRow[];
};

export function InventoryStatus() {
  const data = useLoaderData() as LoaderData;
  const nav = useNavigation();
  const isBusy = nav.state !== "idle";

  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12 }}>
      <h3 style={{ marginTop: 0 }}>Inventory Lookup</h3>

      <Form method="post" style={{ display: "flex", gap: 8 }}>
        <input
          name="productName"
          placeholder="e.g., Blue Shirt"
          defaultValue={data.productName}
          style={{ flex: 1 }}
        />
        <button type="submit" disabled={isBusy}>
          {isBusy ? "Searching..." : "Search"}
        </button>
      </Form>

      <div style={{ marginTop: 12 }}>
        <div style={{ fontWeight: 600 }}>
          Results for: {data.productName || "(none)"}
        </div>

        {data.results?.length ? (
          <ul>
            {data.results.map((r, idx) => (
              <li key={idx}>
                {r.branchName ?? "Branch"}: {r.quantity}
              </li>
            ))}
          </ul>
        ) : (
          <div style={{ opacity: 0.7 }}>No results.</div>
        )}
      </div>
    </div>
  );
}
