import { Form, useLoaderData, useNavigation } from "react-router-dom";

type LoaderData = {
  queryName: string;
  customer: any | null;
  history: any | null;
  error?: string | null;
};

export function CustomerLoyaltyCard() {
  const data = useLoaderData() as LoaderData;
  const nav = useNavigation();
  const isBusy = nav.state !== "idle";

  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12 }}>
      <h3 style={{ marginTop: 0 }}>Customer Profile</h3>

      <Form method="post" style={{ display: "flex", gap: 8 }}>
        <input
          name="customerName"
          placeholder="e.g., Anthony"
          defaultValue={data.queryName}
          style={{ flex: 1 }}
        />
        <button type="submit" disabled={isBusy}>
          {isBusy ? "Searching..." : "Search"}
        </button>
      </Form>

      <div style={{ marginTop: 12 }}>
        {data.error ? (
          <div style={{ color: "crimson" }}>{data.error}</div>
        ) : data.customer ? (
          <>
            <div style={{ fontWeight: 700 }}>
              {data.customer.name ??
                `${data.customer.first_name ?? ""} ${data.customer.last_name ?? ""}`.trim()}
            </div>
            <div style={{ opacity: 0.8 }}>Customer ID: {data.customer.id}</div>

            <h4 style={{ marginBottom: 6 }}>History</h4>
            <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>
              {JSON.stringify(data.history, null, 2)}
            </pre>
          </>
        ) : (
          <div style={{ opacity: 0.7 }}>Search a customer to view profile.</div>
        )}
      </div>
    </div>
  );
}
