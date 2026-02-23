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

  const customer = data.customer;

  const displayName = customer
    ? (customer.name ??
      `${customer.first_name ?? ""} ${customer.last_name ?? ""}`.trim())
    : "";

  const loyaltyPoints = customer
    ? (customer.loyaltyPoints ??
      customer.loyalty_points ??
      customer.loyaltyPoints?.value ??
      0)
    : 0;

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
        ) : customer ? (
          <>
            <div style={{ fontWeight: 700 }}>{displayName}</div>
            <div style={{ opacity: 0.8 }}>Customer ID: {customer.id}</div>

            <div
              style={{
                marginTop: 10,
                padding: 12,
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                background: "#f9fafb",
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
              }}
            >
              <div style={{ fontSize: 12, opacity: 0.75 }}>Loyalty Points</div>
              <div style={{ fontSize: 26, fontWeight: 800 }}>
                {loyaltyPoints}
              </div>
            </div>

            <h4 style={{ marginBottom: 6, marginTop: 12 }}>History</h4>
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
