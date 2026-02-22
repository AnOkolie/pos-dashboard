import { Form, useLoaderData, useNavigation } from "react-router-dom";

type LoaderData = {
  data: any;
};

export const SalesToday = () => {
  const { data } = useLoaderData() as LoaderData;
  const nav = useNavigation();
  const isBusy = nav.state !== "idle";

  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12 }}>
      <h3 style={{ marginTop: 0 }}>Today’s Sales</h3>

      <Form method="post">
        <input type="hidden" name="intent" value="refresh" />
        <button type="submit" disabled={isBusy}>
          {isBusy ? "Refreshing..." : "Refresh"}
        </button>
      </Form>

      <pre style={{ whiteSpace: "pre-wrap" }}>
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
};
